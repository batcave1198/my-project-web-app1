import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Choose a New Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "CUSTOMER" ? "/account" : "/admin");

  const { token } = await searchParams;

  return (
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        Choose a new password
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-muted">
        This link can only be used once. After updating, you will be signed out
        of every device.
      </p>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <Alert tone="error" title="Invalid reset link">
            This link is missing its token. Request a new password reset email.
          </Alert>
          <p className="mt-5 text-center text-sm text-muted">
            <Link
              href="/forgot-password"
              className="link-underline font-semibold text-forest-900"
            >
              Request a new link
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
