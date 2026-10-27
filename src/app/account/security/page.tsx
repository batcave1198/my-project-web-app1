import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { MfaDisablePanel } from "@/components/auth/mfa-disable-panel";
import { MfaSetupPanel } from "@/components/auth/mfa-setup-panel";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeRedirectPath } from "@/lib/validation/auth";

export const metadata: Metadata = {
  title: "Account Security",
  robots: { index: false, follow: false },
};

export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{
    required?: string;
    next?: string;
    verify?: string;
  }>;
}) {
  const user = await requireUser("/account/security");
  const params = await searchParams;
  const account = await db.user.findUnique({
    where: { id: user.id },
    select: { mfaRecoveryCodes: true },
  });

  const isStaff = user.role === "ADMIN" || user.role === "STAFF";
  const continueHref = safeRedirectPath(
    params.next,
    isStaff ? "/admin" : "/account",
  );
  const recoveryCodeCount = account?.mfaRecoveryCodes.length ?? 0;

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-forest-900"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to account
      </Link>

      <div className="mt-6">
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
          Security
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Protect your account with two-factor authentication and keep your
          email address verified.
        </p>
      </div>

      {params.required === "1" && !user.mfaEnabled && (
        <Alert tone="info" className="mt-6" title="Set up two-factor authentication">
          Staff and administrator accounts must enable an authenticator app
          before using the admin area.
        </Alert>
      )}

      {params.verify === "failed" && (
        <Alert tone="error" className="mt-6" title="Verification link invalid">
          That verification link is invalid or has expired. Request a new one
          below.
        </Alert>
      )}

      <section className="mt-8 rounded-lg border border-line bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-900/6">
            <MailCheck aria-hidden="true" className="size-4 text-forest-800" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-forest-900">Email address</h2>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            {user.emailVerifiedAt ? (
              <p className="mt-2 text-sm font-medium text-success">
                Verified
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-warning">
                  Not verified. Check your inbox for the verification link.
                </p>
                <ResendVerificationForm />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-line bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-900/6">
            <ShieldCheck aria-hidden="true" className="size-4 text-forest-800" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-forest-900">
                Two-factor authentication
              </h2>
              <span
                className={
                  user.mfaEnabled
                    ? "rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success"
                    : "rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning"
                }
              >
                {user.mfaEnabled ? "On" : "Off"}
              </span>
            </div>

            {user.mfaEnabled ? (
              <div className="mt-4 space-y-5">
                <p className="text-sm leading-relaxed text-muted">
                  Enabled{" "}
                  {user.mfaEnrolledAt
                    ? new Intl.DateTimeFormat("en-LK", {
                        dateStyle: "medium",
                      }).format(user.mfaEnrolledAt)
                    : "on this account"}
                  . You have {recoveryCodeCount} unused recovery code
                  {recoveryCodeCount === 1 ? "" : "s"} left.
                </p>
                <ButtonLink href={continueHref} />
                <div className="border-t border-line pt-5">
                  <MfaDisablePanel />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <MfaSetupPanel continueHref={continueHref} />
              </div>
            )}
          </div>
        </div>
      </section>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <KeyRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Recovery codes are the only way back in if you lose your authenticator.
        Keep them somewhere safe and offline.
      </p>
    </div>
  );
}

function ButtonLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-md border border-forest-900/25 px-4 text-sm font-semibold text-forest-900 transition-colors hover:border-forest-900/45 hover:bg-forest-900/5"
    >
      Continue
    </Link>
  );
}
