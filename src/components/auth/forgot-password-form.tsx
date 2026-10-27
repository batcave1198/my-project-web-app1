"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import {
  requestPasswordResetAction,
  type AuthState,
} from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordResetAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.success && (
        <Alert tone="success" title="Check your inbox">
          {state.success}
        </Alert>
      )}
      {state?.error && (
        <Alert tone="error" title="Could not send the email">
          {state.error}
        </Alert>
      )}

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          autoFocus
          className="mt-1.5"
          placeholder="you@example.com"
          aria-invalid={state?.fieldErrors?.email ? true : undefined}
          aria-describedby={
            state?.fieldErrors?.email ? "email-error" : "email-hint"
          }
        />
        <FieldHint id="email-hint">
          We will email a one-time reset link. It expires after one hour.
        </FieldHint>
        <FieldError id="email-error">{state?.fieldErrors?.email}</FieldError>
      </div>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Mail aria-hidden="true" />
            Send reset link
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="link-underline font-semibold text-forest-900">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
