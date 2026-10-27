"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import { resetPasswordAction, type AuthState } from "@/lib/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resetPasswordAction,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <Alert tone="error" title="Could not reset your password">
          {state.error}
        </Alert>
      )}

      <div>
        <Label htmlFor="password">New password</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={10}
            autoFocus
            className="pr-11"
            placeholder="At least 10 characters"
            aria-invalid={state?.fieldErrors?.password ? true : undefined}
            aria-describedby="password-hint password-error"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted transition-colors hover:text-forest-900"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        <FieldHint id="password-hint">
          At least 10 characters, including a letter and a number.
        </FieldHint>
        <FieldError id="password-error">
          {state?.fieldErrors?.password}
        </FieldError>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          className="mt-1.5"
          placeholder="Repeat your password"
          aria-invalid={state?.fieldErrors?.confirmPassword ? true : undefined}
          aria-describedby={
            state?.fieldErrors?.confirmPassword ? "confirm-error" : undefined
          }
        />
        <FieldError id="confirm-error">
          {state?.fieldErrors?.confirmPassword}
        </FieldError>
      </div>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            Updating…
          </>
        ) : (
          <>
            <KeyRound aria-hidden="true" />
            Update password
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
