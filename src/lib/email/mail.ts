import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/lib/env";

let cachedTransport: Transporter | null = null;

export function isEmailConfigured() {
  const env = getEnv();
  return Boolean(env.SMTP_HOST && env.MAIL_FROM);
}

function transport() {
  if (cachedTransport) return cachedTransport;
  const env = getEnv();

  cachedTransport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: env.SMTP_PORT === 587,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return cachedTransport;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

/**
 * Best-effort transactional email. A mail outage must never break checkout,
 * registration or password reset — callers surface a retry path instead.
 */
export async function sendEmail(input: SendEmailInput) {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP is not configured; skipped:", input.subject);
    return false;
  }

  try {
    const env = getEnv();
    await transport().sendMail({
      from: env.MAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    return true;
  } catch (error) {
    console.error("[email] send failed:", input.subject, error);
    return false;
  }
}
