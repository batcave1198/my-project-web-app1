import "server-only";
import { getEnv } from "@/lib/env";
import { sendEmail, escapeHtml } from "@/lib/email/mail";
import { siteConfig } from "@/lib/site";

function appUrl() {
  return getEnv().APP_URL.replace(/\/+$/, "");
}

function emailShell(title: string, body: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f6f1e6;font-family:Arial,Helvetica,sans-serif;color:#20332a;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #e6dfcf;border-radius:12px;padding:28px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7a7466;">${escapeHtml(siteConfig.name)}</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#173c2b;">${escapeHtml(title)}</h1>
        ${body}
        <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#7a7466;">If you did not request this email, you can safely ignore it.</p>
      </div>
    </div>
  </body>
</html>`;
}

function actionButton(label: string, url: string) {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#173c2b;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 20px;border-radius:8px;">${escapeHtml(label)}</a></p>
    <p style="margin:0;font-size:12px;line-height:1.6;color:#7a7466;word-break:break-all;">${escapeHtml(url)}</p>`;
}

export async function sendVerificationEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const url = `${appUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const title = "Verify your email address";
  const text = `Hi ${name},\n\nVerify your email address for ${siteConfig.name} by opening this link:\n${url}\n\nThis link expires in 24 hours. If you did not create an account, ignore this email.`;

  return sendEmail({
    to,
    subject: `Verify your email — ${siteConfig.name}`,
    text,
    html: emailShell(
      title,
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">Hi ${escapeHtml(name)},</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">Please confirm this email address to finish setting up your account.</p>
       ${actionButton("Verify email", url)}
       <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#7a7466;">This link expires in 24 hours.</p>`,
    ),
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const title = "Reset your password";
  const text = `Hi ${name},\n\nReset your ${siteConfig.name} password by opening this link:\n${url}\n\nThis link expires in 1 hour and can only be used once. If you did not request a reset, ignore this email.`;

  return sendEmail({
    to,
    subject: `Reset your password — ${siteConfig.name}`,
    text,
    html: emailShell(
      title,
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">Hi ${escapeHtml(name)},</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">Use the button below to choose a new password. For your security this link expires in 1 hour and can only be used once.</p>
       ${actionButton("Reset password", url)}
       <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#7a7466;">If you did not request this, no action is needed.</p>`,
    ),
  });
}
