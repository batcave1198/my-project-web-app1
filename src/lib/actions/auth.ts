"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroyAllSessions,
  destroySession,
  requestMeta,
} from "@/lib/auth/session";
import { consumeRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import {
  clearMfaChallenge,
  createMfaChallenge,
  readMfaChallenge,
} from "@/lib/auth/mfa";
import {
  decryptMfaSecret,
  hashRecoveryCode,
  verifyTotp,
} from "@/lib/auth/totp";
import {
  EMAIL_VERIFICATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  consumeVerificationToken,
  issueVerificationToken,
} from "@/lib/auth/verification";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email/account";
import {
  loginSchema,
  mfaCodeSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
  safeRedirectPath,
} from "@/lib/validation/auth";

const GENERIC_LOGIN_ERROR = "Invalid email or password.";
const GENERIC_RESET_MESSAGE =
  "If an account exists for that email address, a password reset link has been sent.";

export type AuthState =
  | {
      error?: string;
      success?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

function collectFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function scheduleVerificationEmail(email: string, name: string) {
  after(async () => {
    try {
      const token = await issueVerificationToken(
        email,
        "EMAIL_VERIFICATION",
        EMAIL_VERIFICATION_TTL_MS,
      );
      await sendVerificationEmail({ to: email, name, token });
    } catch (error) {
      console.error("[auth] could not queue verification email", error);
    }
  });
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const { email, password, next } = parsed.data;
  const meta = await requestMeta();
  const ipKey = `login:ip:${meta.ipAddress ?? "unknown"}`;
  const emailKey = `login:email:${email}`;

  const [ipLimit, emailLimit] = await Promise.all([
    consumeRateLimit({
      key: ipKey,
      limit: 20,
      windowSeconds: 900,
      blockSeconds: 900,
    }),
    consumeRateLimit({
      key: emailKey,
      limit: 8,
      windowSeconds: 900,
      blockSeconds: 900,
    }),
  ]);

  if (!ipLimit.allowed || !emailLimit.allowed) {
    return {
      error:
        "Too many sign-in attempts. Please wait a few minutes before trying again.",
    };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      isActive: true,
      role: true,
      mfaEnabled: true,
    },
  });

  if (!user) {
    // Equalise timing so a missing account is not distinguishable from a
    // wrong password.
    await hashPassword(password);
    return { error: GENERIC_LOGIN_ERROR };
  }

  const passwordMatches = await verifyPassword(user.passwordHash, password);

  if (!passwordMatches || !user.isActive) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  await Promise.all([resetRateLimit(ipKey), resetRateLimit(emailKey)]);

  const fallback =
    user.role === "ADMIN" || user.role === "STAFF" ? "/admin" : "/account";
  const destination = safeRedirectPath(next, fallback);

  if (user.mfaEnabled) {
    await createMfaChallenge(user.id);
    redirect(
      `/login?mfa=1&next=${encodeURIComponent(destination)}`,
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(user.id, meta, user.role);

  if (user.role !== "CUSTOMER") {
    redirect(
      `/account/security?required=1&next=${encodeURIComponent(destination)}`,
    );
  }

  redirect(destination);
}

export async function loginMfaAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = mfaCodeSchema.safeParse(formData.get("code"));
  const rawNext = formData.get("next");

  if (!parsed.success) {
    return { fieldErrors: { code: parsed.error.issues[0]?.message } };
  }

  const challenge = await readMfaChallenge();
  if (!challenge) {
    return {
      error: "Your sign-in window expired. Please sign in again.",
    };
  }

  if (challenge.attempts >= 5) {
    await clearMfaChallenge();
    return {
      error: "Too many incorrect codes. Please sign in again.",
    };
  }

  const meta = await requestMeta();
  const ipKey = `login:mfa:ip:${meta.ipAddress ?? "unknown"}`;
  const userKey = `login:mfa:user:${challenge.user.id}`;
  const [ipLimit, userLimit] = await Promise.all([
    consumeRateLimit({
      key: ipKey,
      limit: 40,
      windowSeconds: 900,
      blockSeconds: 900,
    }),
    consumeRateLimit({
      key: userKey,
      limit: 20,
      windowSeconds: 900,
      blockSeconds: 900,
    }),
  ]);

  // The per-challenge limit stops a single window; these limits stop an
  // attacker with a stolen password from repeatedly creating new challenges.
  if (!ipLimit.allowed || !userLimit.allowed) {
    await clearMfaChallenge();
    return {
      error:
        "Too many verification attempts. Please wait a few minutes and sign in again.",
    };
  }

  const code = parsed.data;
  const recoveryHash = hashRecoveryCode(code);
  const recoveryIndex = challenge.user.mfaRecoveryCodes.indexOf(recoveryHash);
  let valid = recoveryIndex !== -1;

  if (!valid && /^\d{6}$/.test(code) && challenge.user.mfaSecret) {
    try {
      const secret = decryptMfaSecret(challenge.user.mfaSecret);
      valid = verifyTotp(secret, code);
    } catch (error) {
      console.error("[auth] could not read MFA secret", error);
    }
  }

  if (!valid) {
    const attempts = challenge.attempts + 1;
    if (attempts >= 5) {
      await clearMfaChallenge();
      return {
        error: "Too many incorrect codes. Please sign in again.",
      };
    }
    await db.mfaChallenge.update({
      where: { id: challenge.id },
      data: { attempts },
    });
    return {
      error: `Invalid code. ${5 - attempts} attempt${5 - attempts === 1 ? "" : "s"} remaining.`,
    };
  }

  const fallback =
    challenge.user.role === "ADMIN" || challenge.user.role === "STAFF"
      ? "/admin"
      : "/account";
  const destination = safeRedirectPath(rawNext, fallback);

  await clearMfaChallenge();
  await Promise.all([resetRateLimit(ipKey), resetRateLimit(userKey)]);
  await db.user.update({
    where: { id: challenge.user.id },
    data: {
      lastLoginAt: new Date(),
      ...(recoveryIndex !== -1
        ? {
            mfaRecoveryCodes: {
              set: challenge.user.mfaRecoveryCodes.filter(
                (_, index) => index !== recoveryIndex,
              ),
            },
          }
        : {}),
    },
  });
  await createSession(challenge.user.id, meta, challenge.user.role);

  redirect(destination);
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    marketingOptIn: formData.get("marketingOptIn") === "on",
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const { name, email, password, marketingOptIn } = parsed.data;
  const meta = await requestMeta();

  const limit = await consumeRateLimit({
    key: `register:ip:${meta.ipAddress ?? "unknown"}`,
    limit: 5,
    windowSeconds: 3600,
    blockSeconds: 3600,
  });

  if (!limit.allowed) {
    return {
      error:
        "Too many accounts created from this connection. Please try again later.",
    };
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        marketingOptIn,
        role: "CUSTOMER",
      },
      select: { id: true, role: true },
    });

    await createSession(user.id, meta, "CUSTOMER");
    scheduleVerificationEmail(email, name);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        fieldErrors: {
          email: "An account with this email already exists.",
        },
      };
    }
    return {
      error: "We could not create your account. Please try again.",
    };
  }

  redirect("/account?welcome=1");
}

export async function requestPasswordResetAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const { email } = parsed.data;
  const meta = await requestMeta();

  const [ipLimit, emailLimit] = await Promise.all([
    consumeRateLimit({
      key: `password-reset:ip:${meta.ipAddress ?? "unknown"}`,
      limit: 8,
      windowSeconds: 900,
      blockSeconds: 900,
    }),
    consumeRateLimit({
      key: `password-reset:email:${email}`,
      limit: 4,
      windowSeconds: 900,
      blockSeconds: 900,
    }),
  ]);

  if (!ipLimit.allowed || !emailLimit.allowed) {
    return { success: GENERIC_RESET_MESSAGE };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isActive: true },
  });

  if (user?.isActive) {
    const token = await issueVerificationToken(
      user.email,
      "PASSWORD_RESET",
      PASSWORD_RESET_TTL_MS,
    );
    after(async () => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token,
      });
    });
  }

  return { success: GENERIC_RESET_MESSAGE };
}

export async function resetPasswordAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const meta = await requestMeta();
  const limit = await consumeRateLimit({
    key: `password-reset:complete:${meta.ipAddress ?? "unknown"}`,
    limit: 10,
    windowSeconds: 900,
    blockSeconds: 900,
  });
  if (!limit.allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const { token, password } = parsed.data;
  const identifier = await consumeVerificationToken(token, "PASSWORD_RESET");
  if (!identifier) {
    return {
      error:
        "This password reset link is invalid or has expired. Request a new link.",
    };
  }

  const user = await db.user.findUnique({
    where: { email: identifier },
    select: { id: true },
  });
  if (!user) {
    return { error: "This password reset link is no longer valid." };
  }

  const passwordHash = await hashPassword(password);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      // Following a reset link proves control of the mailbox.
      emailVerifiedAt: new Date(),
    },
  });
  await destroyAllSessions(user.id);
  await destroySession();

  redirect("/login?reset=1");
}

export async function resendVerificationEmailAction(
  _prevState: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  const user = await requireUser("/account/security");
  if (user.emailVerifiedAt) {
    return { success: "Your email address is already verified." };
  }

  const limit = await consumeRateLimit({
    key: `verify-email:resend:${user.id}`,
    limit: 3,
    windowSeconds: 3600,
    blockSeconds: 3600,
  });
  if (!limit.allowed) {
    return {
      error: "You have requested this too many times. Please try again later.",
    };
  }

  const token = await issueVerificationToken(
    user.email,
    "EMAIL_VERIFICATION",
    EMAIL_VERIFICATION_TTL_MS,
  );
  const sent = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    token,
  });

  return sent
    ? { success: "Verification email sent. Check your inbox." }
    : {
        error:
          "Email delivery is not configured yet. Please contact the store administrator.",
      };
}
