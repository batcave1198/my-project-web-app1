import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Request a password reset link for your Ceylon Herbs account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "CUSTOMER" ? "/account" : "/admin");

  return (
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        Forgot your password?
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-muted">
        Enter the email address on your account and we will send a one-time
        reset link.
      </p>

      <ForgotPasswordForm />
    </div>
  );
}
