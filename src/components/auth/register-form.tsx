"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  FieldError,
  FieldHint,
  Input,
  Label,
} from "@/components/ui/field";
import { registerAction, type AuthState } from "@/lib/actions/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    registerAction,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.error && (
        <Alert tone="error" title="Could not create your account">
          {state.error}
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          autoFocus
          className="mt-1.5"
          placeholder="Your name"
          aria-invalid={state?.fieldErrors?.name ? true : undefined}
          aria-describedby={state?.fieldErrors?.name ? "name-error" : undefined}
        />
        <FieldError id="name-error">{state?.fieldErrors?.name}</FieldError>
      </div>

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
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
            autoComplete="new-password"
            required
            minLength={10}
            placeholder="At least 10 characters"
            className="pr-11"
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
        <FieldError id="password-error">{state?.fieldErrors?.password}</FieldError>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
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

      <div className="space-y-3 rounded-md border border-line bg-cream-100/60 p-4">
        <Checkbox
          name="marketingOptIn"
          label="Send me occasional emails about new arrivals and offers."
        />
        <div>
          <Checkbox
            name="acceptTerms"
            required
            label={
              <>
                I agree to the{" "}
                <Link href="/terms" className="link-underline font-medium text-forest-900">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy-policy"
                  className="link-underline font-medium text-forest-900"
                >
                  Privacy Policy
                </Link>
                .
              </>
            }
          />
          <FieldError>{state?.fieldErrors?.acceptTerms}</FieldError>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            <UserPlus aria-hidden="true" />
            Create Account
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="link-underline font-semibold text-forest-900">
          Sign in
        </Link>
      </p>
    </form>
  );
}
