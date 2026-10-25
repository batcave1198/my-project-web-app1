import "server-only";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_REFRESH_THRESHOLD_MS, SESSION_TTL_MS } from "@/lib/utils";
import { generateToken, hashToken } from "@/lib/auth/tokens";

export const SESSION_COOKIE = "chai_session";

export type SessionMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/**
 * Creates a brand new session. Any token already present in the browser is
 * destroyed first so a stolen pre-login cookie is never promoted.
 */
export async function createSession(userId: string, meta: SessionMeta = {}) {
  await destroySession();

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent?.slice(0, 500) ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(expiresAt));

  return { token, expiresAt };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export type ValidatedSession = {
  sessionId: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: "CUSTOMER" | "STAFF" | "ADMIN";
    emailVerifiedAt: Date | null;
  };
};

/**
 * Secure session check. Always hits the database — never trust the cookie
 * alone for authorisation decisions.
 */
export async function validateSession(): Promise<ValidatedSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  if (!session.user.isActive) return null;

  const now = Date.now();
  const shouldTouch = now - session.lastUsedAt.getTime() > 60 * 60 * 1000;
  const shouldExtend =
    session.expiresAt.getTime() - now < SESSION_REFRESH_THRESHOLD_MS;

  if (shouldTouch || shouldExtend) {
    await db.session
      .update({
        where: { id: session.id },
        data: {
          lastUsedAt: new Date(),
          ...(shouldExtend
            ? { expiresAt: new Date(now + SESSION_TTL_MS) }
            : {}),
        },
      })
      .catch(() => undefined);
  }

  return {
    sessionId: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      phone: session.user.phone,
      role: session.user.role,
      emailVerifiedAt: session.user.emailVerifiedAt,
    },
  };
}

/** Reads the caller's IP + user-agent for audit trails and rate limiting. */
export async function requestMeta(): Promise<SessionMeta> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;

  return {
    ipAddress,
    userAgent: headerStore.get("user-agent"),
  };
}
