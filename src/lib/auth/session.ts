import crypto from "crypto";
import { prisma } from "../db/prisma";
import { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "srgc_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export interface AuthenticatedUser {
  id: string;
  identifier: string;
  email: string | null;
  role: Role;
  isActive: boolean;
  studentId?: string;
  facultyId?: string;
}

export interface SessionContext {
  user: AuthenticatedUser;
  sessionId: string;
}

/**
 * Generates a 256-bit cryptographically secure random session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Computes SHA-256 hash of a session token for safe persistence.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new database session record and returns the raw plaintext token for the client cookie.
 */
export async function createSession(
  userId: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<{ token: string; expiresAt: Date; sessionId: string }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  });

  return { token, expiresAt, sessionId: session.id };
}

/**
 * Validates a session token string against the database.
 */
export async function validateSessionToken(
  token: string
): Promise<SessionContext | null> {
  if (!token || token.length !== 64) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          studentProfile: { select: { id: true } },
          facultyProfile: { select: { id: true } },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Check user active state
  if (!session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const user: AuthenticatedUser = {
    id: session.user.id,
    identifier: session.user.identifier,
    email: session.user.email,
    role: session.user.role,
    isActive: session.user.isActive,
    studentId: session.user.studentProfile?.id,
    facultyId: session.user.facultyProfile?.id,
  };

  return {
    user,
    sessionId: session.id,
  };
}

/**
 * Invalidates an active session token.
 */
export async function invalidateSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

/**
 * Invalidates all active sessions for a specific user.
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}
