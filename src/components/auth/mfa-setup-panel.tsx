"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import {
  enableMfaAction,
  startMfaSetupAction,
  type MfaSecurityState,
} from "@/lib/actions/security";

const initialState: MfaSecurityState = { status: "idle" };

export function MfaSetupPanel({ continueHref }: { continueHref: string }) {
  const [startState, startAction, starting] = useActionState<
    MfaSecurityState,
    FormData
  >(startMfaSetupAction, initialState);
  const [enableState, enableAction, enabling] = useActionState<
    MfaSecurityState,
    FormData
  >(enableMfaAction, initialState);
  const [copied, setCopied] = useState(false);

  const enabled = enableState?.status === "enabled";
  const secret = startState?.secret;

  if (enabled && enableState?.recoveryCodes) {
    return (
      <div className="space-y-5">
        <Alert tone="success" title="Two-factor authentication is on">
          {enableState.message}
        </Alert>

        <div className="rounded-lg border border-line bg-cream-50 p-5">
          <p className="text-sm font-semibold text-forest-900">
            Recovery codes
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Each code can be used once if you lose access to your authenticator.
            Store them offline, not in your email.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm text-ink">
            {enableState.recoveryCodes.map((code) => (
              <li
                key={code}
                className="rounded-md border border-line bg-white px-3 py-2 tracking-wider"
              >
                {code}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={async () => {
              await navigator.clipboard.writeText(
                enableState.recoveryCodes?.join("\n") ?? "",
              );
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy codes"}
          </Button>
        </div>

        <Button asChild size="lg">
          <Link href={continueHref}>Continue</Link>
        </Button>
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="space-y-5">
        {startState?.error && (
          <Alert tone="error" title="Could not start setup">
            {startState.error}
          </Alert>
        )}
        <p className="text-sm leading-relaxed text-muted">
          Use an authenticator app such as Google Authenticator, Microsoft
          Authenticator, 1Password or Authy. Staff and administrator accounts
          must enable it before entering the admin area.
        </p>
        <form action={startAction}>
          <Button type="submit" disabled={starting} size="lg">
            {starting ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" />
                Preparing…
              </>
            ) : (
              <>
                <Smartphone aria-hidden="true" />
                Set up authenticator
              </>
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {startState?.message && (
        <Alert tone="info" title="Scan the QR code">
          {startState.message}
        </Alert>
      )}
      {enableState?.status === "error" && enableState.error && (
        <Alert tone="error" title="Could not verify that code">
          {enableState.error}
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
        <div className="rounded-lg border border-line bg-white p-3">
          {/* A data URL QR code is generated server-side. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={startState.qrDataUrl}
            alt="Authenticator setup QR code"
            width={240}
            height={240}
            className="h-auto w-full"
          />
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-sm font-semibold text-forest-900">
              Cannot scan the code?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Enter this setup key in your authenticator app manually:
            </p>
            <code className="mt-2 block break-all rounded-md border border-line bg-cream-50 px-3 py-2 font-mono text-xs tracking-wider text-ink">
              {secret}
            </code>
          </div>

          <form action={enableAction} className="space-y-4">
            <input type="hidden" name="secret" value={secret} />
            <div>
              <Label htmlFor="mfa-code">6-digit code</Label>
              <Input
                id="mfa-code"
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                required
                maxLength={6}
                className="mt-1.5 max-w-40 font-mono tracking-[0.25em]"
                placeholder="123456"
              />
              <FieldHint>
                Enter the current code shown in your authenticator app.
              </FieldHint>
              <FieldError />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={enabling}>
                {enabling ? (
                  <>
                    <Loader2 aria-hidden="true" className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck aria-hidden="true" />
                    Turn on two-factor authentication
                  </>
                )}
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/account/security">Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
