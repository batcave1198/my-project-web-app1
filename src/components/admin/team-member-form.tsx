"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import {
  addTeamMember,
  type TeamMemberActionState,
} from "@/lib/actions/admin-users";

const initialState: TeamMemberActionState = { status: "idle" };

export function TeamMemberForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<TeamMemberActionState>(initialState);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await addTeamMember(state, formData);
      setState(result);
      if (result.status === "success") {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-lg border border-line bg-white p-5"
    >
      <div className="flex items-center gap-2">
        <UserPlus aria-hidden="true" className="size-4 text-forest-800" />
        <h2 className="text-base font-semibold text-forest-900">Add administrator</h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Only administrators can create team accounts. Use a unique password and
        share it through a secure channel.
      </p>

      {state.status === "success" && state.message && (
        <p
          role="status"
          className="mt-4 rounded-md border border-success/25 bg-success-soft px-3 py-2.5 text-sm text-success"
        >
          {state.message}
        </p>
      )}
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="team-name">Full name</Label>
          <Input id="team-name" name="name" required maxLength={100} className="mt-1.5" />
          <FieldError>{state.fieldErrors?.name}</FieldError>
        </div>
        <div>
          <Label htmlFor="team-role">Role</Label>
          <select
            id="team-role"
            name="role"
            defaultValue="STAFF"
            className="mt-1.5 block h-11 w-full rounded-md border border-line-strong bg-white px-3.5 text-sm"
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Administrator</option>
          </select>
          <FieldError>{state.fieldErrors?.role}</FieldError>
        </div>
        <div>
          <Label htmlFor="team-email">Email</Label>
          <Input
            id="team-email"
            name="email"
            type="email"
            required
            autoComplete="off"
            className="mt-1.5"
          />
          <FieldError>{state.fieldErrors?.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="team-password">Temporary password</Label>
          <Input
            id="team-password"
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="mt-1.5"
          />
          <p className="mt-1 text-[0.68rem] text-muted">
            At least 10 characters with a letter and number.
          </p>
          <FieldError>{state.fieldErrors?.password}</FieldError>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="mt-4">
        {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Add account
      </Button>
    </form>
  );
}
