"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { loginAction, type AuthState } from "@/lib/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state?.error && (
        <Alert tone="error" title="Could not sign you in">
          {state.error}
        </Alert>
      )}

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          className="mt-1.5"
          placeholder="you@example.com"
          aria-invalid={state?.fieldErrors?.email ? true : undefined}
          aria-describedby={
            state?.fieldErrors?.email ? "email-error" : undefined
          }
        />
        <FieldError id="email-error">{state?.fieldErrors?.email}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Your password"
            className="pr-11"
            aria-invalid={state?.fieldErrors?.password ? true : undefined}
            aria-describedby={
              state?.fieldErrors?.password ? "password-error" : undefined
            }
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
        <FieldError id="password-error">{state?.fieldErrors?.password}</FieldError>
      </div>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LockKeyhole aria-hidden="true" />
            Sign In
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted">
        New to{" "}
        <span className="font-medium text-ink-soft">Ceylon Herbs</span>?{" "}
        <Link href="/register" className="link-underline font-semibold text-forest-900">
          Create an account
        </Link>
      </p>
    </form>
  );
}
