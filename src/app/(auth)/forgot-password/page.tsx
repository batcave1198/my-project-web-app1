import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Request a password reset link for your Ceylon Herbs account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "CUSTOMER" ? "/account" : "/admin");

  const copy = await getSiteCopy();

  return (
    <div>
      <p className="eyebrow">{copy.auth.forgot.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        {copy.auth.forgot.title}
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-muted">
        {copy.auth.forgot.body}
      </p>

      <ForgotPasswordForm />
    </div>
  );
}
