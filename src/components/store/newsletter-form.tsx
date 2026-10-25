"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  subscribeToNewsletter,
  type NewsletterState,
} from "@/lib/actions/newsletter";

const initialState: NewsletterState = { status: "idle" };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletter,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-lg border border-success/25 bg-success-soft px-5 py-4 text-sm text-success"
      >
        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby={state.message ? "newsletter-error" : undefined}
          className="sm:flex-1"
        />
        <Button type="submit" disabled={pending} className="sm:w-auto">
          {pending ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin" />
              Joining…
            </>
          ) : (
            <>
              Subscribe
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      {state.status === "error" && state.message && (
        <p id="newsletter-error" role="alert" className="mt-2 text-sm text-danger">
          {state.message}
        </p>
      )}

      <p className="mt-2 text-xs text-muted">
        By subscribing you agree to our{" "}
        <a href="/privacy-policy" className="link-underline">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
