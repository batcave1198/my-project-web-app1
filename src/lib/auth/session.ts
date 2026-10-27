import "server-only";
import { isIP } from "node:net";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { SESSION_REFRESH_THRESHOLD_MS, SESSION_TTL_MS } from "@/lib/utils";
import { generateToken, hashToken } from "@/lib/auth/tokens";

export const SESSION_COOKIE = "chai_session";
const STAFF_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const STAFF_REFRESH_THRESHOLD_MS = 2 * 60 * 60 * 1000;

export type SessionMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

function sessionLifetime(role: "CUSTOMER" | "STAFF" | "ADMIN") {
  return role === "CUSTOMER"
    ? { ttl: SESSION_TTL_MS, refresh: SESSION_REFRESH_THRESHOLD_MS }
    : { ttl: STAFF_SESSION_TTL_MS, refresh: STAFF_REFRESH_THRESHOLD_MS };
}

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
export async function createSession(
  userId: string,
  meta: SessionMeta = {},
  role: "CUSTOMER" | "STAFF" | "ADMIN" = "CUSTOMER",
) {
  await destroySession();

  const token = generateToken();
  const tokenHash = hashToken(token);
  const { ttl } = sessionLifetime(role);
  const expiresAt = new Date(Date.now() + ttl);

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
    mfaEnabled: boolean;
    mfaEnrolledAt: Date | null;
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
          mfaEnabled: true,
          mfaEnrolledAt: true,
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
  const lifetime = sessionLifetime(session.user.role);
  const shouldTouch = now - session.lastUsedAt.getTime() > 60 * 60 * 1000;
  const shouldExtend = session.expiresAt.getTime() - now < lifetime.refresh;

  if (shouldTouch || shouldExtend) {
    await db.session
      .update({
        where: { id: session.id },
        data: {
          lastUsedAt: new Date(),
          ...(shouldExtend ? { expiresAt: new Date(now + lifetime.ttl) } : {}),
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
      mfaEnabled: session.user.mfaEnabled,
      mfaEnrolledAt: session.user.mfaEnrolledAt,
    },
  };
}

function validIp(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate || candidate.length > 64) return null;
  // Strip an optional IPv6 port, e.g. [2001:db8::1]:443.
  const withoutPort = candidate.replace(/^\[([^\]]+)\](?::\d+)?$/, "$1");
  return isIP(withoutPort) ? withoutPort : null;
}

/**
 * Reads the caller's IP + user-agent for audit trails and rate limiting.
 *
 * Forwarded headers are only trusted when TRUST_PROXY=true. In production the
 * app must sit behind Nginx bound to 127.0.0.1, with Nginx overwriting
 * X-Real-IP and X-Forwarded-For. Taking the first XFF value (the old
 * behaviour) lets a client spoof any address and bypass rate limits.
 */
export async function requestMeta(): Promise<SessionMeta> {
  const headerStore = await headers();
  const env = getEnv();
  let ipAddress: string | null = null;

  if (env.TRUST_PROXY) {
    ipAddress = validIp(headerStore.get("x-real-ip"));
    if (!ipAddress) {
      // XFF is a comma-separated chain. The right-most address is the one
      // added by the nearest trusted proxy.
      const forwarded = headerStore.get("x-forwarded-for")?.split(",");
      ipAddress = validIp(forwarded?.at(-1));
    }
  }

  return {
    ipAddress,
    userAgent: headerStore.get("user-agent"),
  };
}
