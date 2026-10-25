"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requestMeta } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/auth/rate-limit";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name")
    .max(100, "Name is too long"),
  email: z
    .email("Enter a valid email address")
    .max(254, "Email is too long")
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(40, "Phone number is too long")
    .optional()
    .transform((value) => (value ? value : null)),
  subject: z
    .string()
    .trim()
    .min(3, "Add a short subject")
    .max(150, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(20, "Please give us a little more detail (at least 20 characters)")
    .max(4000, "Message is too long"),
  website: z.string().max(0).optional(),
});

export async function sendContactMessage(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  // Honeypot filled in: silently pretend success so bots learn nothing.
  if (parsed.data.website) {
    return {
      status: "success",
      message: "Thank you — your message has been sent.",
    };
  }

  const meta = await requestMeta();
  const limit = await consumeRateLimit({
    key: `contact:${meta.ipAddress ?? "unknown"}`,
    limit: 3,
    windowSeconds: 3600,
    blockSeconds: 3600,
  });

  if (!limit.allowed) {
    return {
      status: "error",
      message:
        "You have sent several messages in a short time. Please try again later, or email us directly.",
    };
  }

  try {
    const { name, email, phone, subject, message } = parsed.data;
    await db.contactMessage.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        ipAddress: meta.ipAddress ?? null,
      },
    });
  } catch {
    return {
      status: "error",
      message:
        "We could not send your message right now. Please try again in a moment.",
    };
  }

  return {
    status: "success",
    message:
      "Thank you — your message has been received. We will reply to the email address you provided.",
  };
}
