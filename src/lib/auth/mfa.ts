import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth/tokens";

export const MFA_COOKIE = "chai_mfa";
const MFA_CHALLENGE_TTL_MS = 10 * 60 * 1000;

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createMfaChallenge(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + MFA_CHALLENGE_TTL_MS);

  await db.mfaChallenge.deleteMany({
    where: { OR: [{ userId }, { expiresAt: { lt: new Date() } }] },
  });

  await db.mfaChallenge.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(MFA_COOKIE, token, cookieOptions(expiresAt));
}

export async function readMfaChallenge() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MFA_COOKIE)?.value;
  if (!token) return null;

  const challenge = await db.mfaChallenge.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          mfaEnabled: true,
          mfaSecret: true,
          mfaRecoveryCodes: true,
        },
      },
    },
  });

  if (!challenge || challenge.expiresAt.getTime() <= Date.now()) return null;
  if (!challenge.user.isActive || !challenge.user.mfaEnabled) return null;
  return challenge;
}

export async function clearMfaChallenge() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MFA_COOKIE)?.value;
  if (token) {
    await db.mfaChallenge
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  cookieStore.delete(MFA_COOKIE);
}
