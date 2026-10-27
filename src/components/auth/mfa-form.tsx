"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import { loginMfaAction, type AuthState } from "@/lib/actions/auth";

export function MfaForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginMfaAction,
    undefined,
  );

  const backHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state?.error && (
        <Alert tone="error" title="Could not verify that code">
          {state.error}
        </Alert>
      )}

      <div>
        <Label htmlFor="code">Authentication code</Label>
        <Input
          id="code"
          name="code"
          autoComplete="one-time-code"
          inputMode="text"
          required
          autoFocus
          maxLength={32}
          className="mt-1.5 font-mono tracking-[0.18em]"
          placeholder="123456"
          aria-invalid={state?.fieldErrors?.code ? true : undefined}
          aria-describedby="code-hint code-error"
        />
        <FieldHint id="code-hint">
          Enter the 6-digit code from your authenticator app, or one of your
          saved recovery codes.
        </FieldHint>
        <FieldError id="code-error">{state?.fieldErrors?.code}</FieldError>
      </div>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            <KeyRound aria-hidden="true" />
            Verify and sign in
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link href={backHref} className="link-underline font-semibold text-forest-900">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
