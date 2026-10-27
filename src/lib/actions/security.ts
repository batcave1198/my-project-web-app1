"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { verifyPassword } from "@/lib/auth/password";
import { consumeRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { recordAuditLog } from "@/lib/admin/audit";
import {
  buildTotpUri,
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotp,
} from "@/lib/auth/totp";

const codeSchema = z
  .string()
  .trim()
  .min(6, "Enter the 6-digit code from your authenticator app")
  .max(32, "That code is too long");

const disableSchema = z.object({
  password: z
    .string()
    .min(1, "Enter your password")
    .max(128, "Password is too long"),
  code: codeSchema,
});

const secretSchema = z
  .string()
  .trim()
  .regex(/^[A-Z2-7]{16,64}$/i, "The authenticator secret is invalid");

export type MfaSecurityState = {
  status: "idle" | "setup" | "enabled" | "disabled" | "error";
  message?: string;
  error?: string;
  secret?: string;
  uri?: string;
  qrDataUrl?: string;
  recoveryCodes?: string[];
};

export async function startMfaSetupAction(
  _prev: MfaSecurityState,
  _formData: FormData,
): Promise<MfaSecurityState> {
  const user = await requireUser("/account/security");
  if (user.mfaEnabled) {
    return { status: "error", error: "Two-factor authentication is already on." };
  }

  const secret = generateTotpSecret();
  const uri = buildTotpUri({ secret, email: user.email });
  const qrDataUrl = await QRCode.toDataURL(uri, {
    margin: 1,
    width: 240,
    errorCorrectionLevel: "M",
  });

  return {
    status: "setup",
    secret,
    uri,
    qrDataUrl,
    message:
      "Scan the QR code with your authenticator app, then enter the 6-digit code it shows.",
  };
}

export async function enableMfaAction(
  _prev: MfaSecurityState,
  formData: FormData,
): Promise<MfaSecurityState> {
  const user = await requireUser("/account/security");
  if (user.mfaEnabled) {
    return { status: "error", error: "Two-factor authentication is already on." };
  }

  const secretResult = secretSchema.safeParse(formData.get("secret"));
  const codeResult = codeSchema.safeParse(formData.get("code"));
  if (!secretResult.success || !codeResult.success) {
    return {
      status: "error",
      error:
        codeResult.success
          ? "The setup session expired. Start again."
          : codeResult.error.issues[0]?.message,
    };
  }

  const secret = secretResult.data.toUpperCase();
  if (!verifyTotp(secret, codeResult.data)) {
    return {
      status: "error",
      error:
        "That code was not accepted. Check your device clock and try the next code.",
    };
  }

  const recoveryCodes = generateRecoveryCodes();
  await db.user.update({
    where: { id: user.id },
    data: {
      mfaEnabled: true,
      mfaSecret: encryptMfaSecret(secret),
      mfaRecoveryCodes: recoveryCodes.map(hashRecoveryCode),
      mfaEnrolledAt: new Date(),
    },
  });

  await recordAuditLog({
    actorUserId: user.id,
    action: "account.mfa.enable",
    entityType: "User",
    entityId: user.id,
  });

  revalidatePath("/account/security");
  revalidatePath("/admin");

  return {
    status: "enabled",
    recoveryCodes,
    message:
      "Two-factor authentication is on. Save these recovery codes somewhere safe — they are shown only once.",
  };
}

export async function disableMfaAction(
  _prev: MfaSecurityState,
  formData: FormData,
): Promise<MfaSecurityState> {
  const user = await requireUser("/account/security");
  if (!user.mfaEnabled) {
    return {
      status: "error",
      error: "Two-factor authentication is not enabled on this account.",
    };
  }

  const parsed = disableSchema.safeParse({
    password: formData.get("password"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      error:
        parsed.error.issues[0]?.message ??
        "Enter your password and authenticator code.",
    };
  }

  const { password, code } = parsed.data;
  const limitKey = `account:mfa-disable:${user.id}`;
  const limit = await consumeRateLimit({
    key: limitKey,
    limit: 5,
    windowSeconds: 900,
    blockSeconds: 900,
  });
  if (!limit.allowed) {
    return {
      status: "error",
      error: "Too many attempts. Please try again in a few minutes.",
    };
  }

  const account = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, mfaSecret: true, mfaRecoveryCodes: true },
  });
  if (!account) {
    return { status: "error", error: "Account not found." };
  }

  const passwordMatches = await verifyPassword(account.passwordHash, password);
  let codeMatches = false;

  if (passwordMatches && account.mfaSecret) {
    try {
      codeMatches = verifyTotp(decryptMfaSecret(account.mfaSecret), code);
    } catch (error) {
      console.error("[security] could not read MFA secret", error);
    }
  }
  if (passwordMatches && !codeMatches) {
    codeMatches = account.mfaRecoveryCodes.includes(hashRecoveryCode(code));
  }

  if (!passwordMatches || !codeMatches) {
    return { status: "error", error: "Password or authenticator code is incorrect." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaRecoveryCodes: [],
      mfaEnrolledAt: null,
    },
  });

  await recordAuditLog({
    actorUserId: user.id,
    action: "account.mfa.disable",
    entityType: "User",
    entityId: user.id,
  });
  await resetRateLimit(limitKey);

  revalidatePath("/account/security");
  revalidatePath("/admin");

  return {
    status: "disabled",
    message:
      "Two-factor authentication is off. Staff and administrator accounts must turn it back on before using the admin area.",
  };
}
