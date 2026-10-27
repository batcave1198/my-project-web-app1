import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { MfaForm } from "@/components/auth/mfa-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/dal";
import { readMfaChallenge } from "@/lib/auth/mfa";
import { getSiteCopy } from "@/lib/content";
import { safeRedirectPath } from "@/lib/validation/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Ceylon Herbs and Spices account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    mfa?: string;
    reset?: string;
    reason?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    redirect(
      safeRedirectPath(
        params.next,
        user.role === "CUSTOMER" ? "/account" : "/admin",
      ),
    );
  }

  const [challenge, copy] = await Promise.all([
    params.mfa === "1" ? readMfaChallenge() : Promise.resolve(null),
    getSiteCopy(),
  ]);

  if (challenge) {
    return (
      <div>
        <p className="eyebrow">{copy.auth.login.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
          {copy.auth.login.mfaTitle}
        </h1>
        <p className="mt-2 mb-8 text-sm leading-relaxed text-muted">
          {copy.auth.login.mfaBodyPrefix}{" "}
          <span className="font-medium text-ink-soft">{challenge.user.email}</span>
          {copy.auth.login.mfaBodySuffix}
        </p>

        <MfaForm next={params.next} />
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">{copy.auth.login.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        {copy.auth.login.title}
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-muted">
        {copy.auth.login.body}
      </p>

      {params.reset === "1" && (
        <Alert tone="success" className="mb-5" title="Password updated">
          Sign in with your new password.
        </Alert>
      )}

      {params.mfa === "1" && !challenge && (
        <Alert tone="info" className="mb-5" title="Sign-in window expired">
          Please enter your email and password again.
        </Alert>
      )}

      {params.reason === "timeout" && (
        <Alert tone="info" className="mb-5" title="Session expired">
          For your security, please sign in again.
        </Alert>
      )}

      <LoginForm next={params.next} />
    </div>
  );
}
