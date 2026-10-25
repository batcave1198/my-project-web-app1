"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  requestMeta,
} from "@/lib/auth/session";
import { consumeRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import {
  loginSchema,
  registerSchema,
  safeRedirectPath,
} from "@/lib/validation/auth";

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export type AuthState =
  | {
      error?: string;
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
    select: { id: true, passwordHash: true, isActive: true, role: true },
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

  await Promise.all([
    resetRateLimit(ipKey),
    resetRateLimit(emailKey),
  ]);

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id, meta);

  const fallback =
    user.role === "ADMIN" || user.role === "STAFF" ? "/admin" : "/account";

  redirect(safeRedirectPath(next, fallback));
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

    await createSession(user.id, meta);
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
