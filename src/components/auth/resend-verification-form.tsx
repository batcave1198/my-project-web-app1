"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  resendVerificationEmailAction,
  type AuthState,
} from "@/lib/actions/auth";

export function ResendVerificationForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resendVerificationEmailAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && (
        <Alert tone="success" title="Verification email sent">
          {state.success}
        </Alert>
      )}
      {state?.error && (
        <Alert tone="error" title="Could not send the email">
          {state.error}
        </Alert>
      )}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Mail aria-hidden="true" />
            Resend verification email
          </>
        )}
      </Button>
    </form>
  );
}
