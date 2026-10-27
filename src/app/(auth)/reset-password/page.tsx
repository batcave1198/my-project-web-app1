import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSiteCopy } from "@/lib/content";

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

  const [{ token }, copy] = await Promise.all([searchParams, getSiteCopy()]);

  return (
    <div>
      <p className="eyebrow">{copy.auth.reset.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        {copy.auth.reset.title}
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-muted">
        {copy.auth.reset.body}
      </p>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <Alert tone="error" title={copy.auth.reset.invalidTitle}>
            {copy.auth.reset.invalidBody}
          </Alert>
          <p className="mt-5 text-center text-sm text-muted">
            <Link
              href="/forgot-password"
              className="link-underline font-semibold text-forest-900"
            >
              {copy.auth.reset.newLink}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
