import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/argon";
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { consumeRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { logAuditDirect } from "@/lib/audit/audit-logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Identifier and password are required" },
        { status: 400 }
      );
    }

    const trimmedId = String(identifier).trim();

    // 1. Rate Limiting Check (by IP and Identifier)
    const ipLimit = await consumeRateLimit(`login:ip:${ip}`, 10, 300);
    const idLimit = await consumeRateLimit(`login:id:${trimmedId}`, 5, 300);

    if (!ipLimit.allowed || !idLimit.allowed) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please try again in 5 minutes." },
        { status: 429 }
      );
    }

    // 2. Fetch User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { identifier: { equals: trimmedId, mode: "insensitive" } },
          { email: { equals: trimmedId, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      await logAuditDirect({
        action: "LOGIN_FAILED",
        entityType: "User",
        ipAddress: ip,
        userAgent,
        oldValues: { attemptedIdentifier: trimmedId },
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact the administrator." },
        { status: 403 }
      );
    }

    // 3. Verify Password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logAuditDirect({
        userId: user.id,
        action: "LOGIN_FAILED",
        entityType: "User",
        entityId: user.id,
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 4. Success: Reset rate limits & create session
    await resetRateLimit(`login:id:${trimmedId}`);

    const { token, expiresAt } = await createSession(user.id, {
      ipAddress: ip,
      userAgent,
    });

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAuditDirect({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      ipAddress: ip,
      userAgent,
    });

    const isProduction = process.env["NODE_ENV"] === "production";
    const res = NextResponse.json({
      success: true,
      role: user.role,
      user: {
        id: user.id,
        identifier: user.identifier,
        email: user.email,
        role: user.role,
      },
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return res;
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}

