"use client";

import { useActionState } from "react";
import { Loader2, ShieldOff } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { disableMfaAction, type MfaSecurityState } from "@/lib/actions/security";

const initialState: MfaSecurityState = { status: "idle" };

export function MfaDisablePanel() {
  const [state, formAction, pending] = useActionState<
    MfaSecurityState,
    FormData
  >(disableMfaAction, initialState);

  return (
    <div className="space-y-5">
      {state?.status === "disabled" && (
        <Alert tone="success" title="Two-factor authentication disabled">
          {state.message}
        </Alert>
      )}
      {state?.status === "error" && state.error && (
        <Alert tone="error" title="Could not disable two-factor authentication">
          {state.error}
        </Alert>
      )}

      <p className="text-sm leading-relaxed text-muted">
        Turning it off requires both your password and a current authenticator
        or recovery code.
      </p>

      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="disable-password">Password</Label>
          <Input
            id="disable-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="disable-code">Authenticator code</Label>
          <Input
            id="disable-code"
            name="code"
            autoComplete="one-time-code"
            required
            maxLength={32}
            className="mt-1.5 font-mono tracking-wider"
            placeholder="123456"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" />
                Disabling…
              </>
            ) : (
              <>
                <ShieldOff aria-hidden="true" />
                Disable two-factor authentication
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
