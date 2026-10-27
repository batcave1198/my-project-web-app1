import "server-only";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth/tokens";

export type VerificationPurpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export async function issueVerificationToken(
  identifier: string,
  purpose: VerificationPurpose,
  ttlMs: number,
) {
  await db.verificationToken.deleteMany({
    where: { identifier, purpose },
  });

  const token = generateToken();
  await db.verificationToken.create({
    data: {
      identifier,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });

  return token;
}

export async function consumeVerificationToken(
  token: string,
  purpose: VerificationPurpose,
) {
  if (!token || token.length > 200) return null;

  const record = await db.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      identifier: true,
      purpose: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (
    !record ||
    record.purpose !== purpose ||
    record.usedAt ||
    record.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  const claimed = await db.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  return claimed.count === 1 ? record.identifier : null;
}
