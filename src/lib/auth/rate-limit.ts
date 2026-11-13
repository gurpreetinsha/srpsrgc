import { prisma } from "../db/prisma";

export interface RateLimitResult {
  allowed: boolean;
  remainingPoints: number;
  resetAt: Date;
}

/**
 * PostgreSQL-backed atomic rate limiter.
 * Safe across serverless instances without in-memory state.
 */
export async function consumeRateLimit(
  key: string,
  maxPoints: number = 5,
  windowSeconds: number = 300
): Promise<RateLimitResult> {
  const now = new Date();
  const newExpireAt = new Date(now.getTime() + windowSeconds * 1000);

  // Use a transaction to ensure atomic read-update
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitRecord.findUnique({
      where: { key },
    });

    if (!existing || existing.expireAt.getTime() < now.getTime()) {
      // Record does not exist or has expired: create or reset
      const updated = await tx.rateLimitRecord.upsert({
        where: { key },
        create: {
          key,
          points: 1,
          expireAt: newExpireAt,
        },
        update: {
          points: 1,
          expireAt: newExpireAt,
        },
      });

      return {
        allowed: true,
        remainingPoints: Math.max(0, maxPoints - updated.points),
        resetAt: updated.expireAt,
      };
    }

    // Existing active window: increment points
    const newPoints = existing.points + 1;
    await tx.rateLimitRecord.update({
      where: { key },
      data: { points: newPoints },
    });

    const isAllowed = newPoints <= maxPoints;

    return {
      allowed: isAllowed,
      remainingPoints: Math.max(0, maxPoints - newPoints),
      resetAt: existing.expireAt,
    };
  });
}

/**
 * Resets a rate limit counter (e.g. upon successful authentication).
 */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimitRecord.deleteMany({
    where: { key },
  });
}
