"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requestMeta } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/auth/rate-limit";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const schema = z.object({
  email: z
    .email("Enter a valid email address")
    .max(254)
    .transform((value) => value.toLowerCase()),
});

export async function subscribeToNewsletter(
  _prevState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  const meta = await requestMeta();
  const limit = await consumeRateLimit({
    key: `newsletter:${meta.ipAddress ?? "unknown"}`,
    limit: 5,
    windowSeconds: 600,
    blockSeconds: 900,
  });

  if (!limit.allowed) {
    return {
      status: "error",
      message: "Too many sign-up attempts. Please try again in a few minutes.",
    };
  }

  try {
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: { isActive: true, unsubscribedAt: null },
      create: { email: parsed.data.email, source: "homepage" },
    });
  } catch {
    return {
      status: "error",
      message: "We could not save your email right now. Please try again.",
    };
  }

  return {
    status: "success",
    message: "You are on the list. Look out for our next update.",
  };
}
