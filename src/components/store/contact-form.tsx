"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  FieldHint,
  Input,
  Label,
  Textarea,
} from "@/components/ui/field";
import { sendContactMessage, type ContactState } from "@/lib/actions/contact";

const initialState: ContactState = { status: "idle" };

const fieldClass = "mt-1.5";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-lg border border-success/25 bg-success-soft px-6 py-10 text-center"
      >
        <CheckCircle2 aria-hidden="true" className="mx-auto size-9 text-success" />
        <h2 className="mt-3 text-xl font-semibold text-forest-900">
          Message received
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-success/90">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Your name</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            className={fieldClass}
            aria-invalid={state.fieldErrors?.name ? true : undefined}
            aria-describedby={
              state.fieldErrors?.name ? "contact-name-error" : undefined
            }
          />
          <FieldError id="contact-name-error">
            {state.fieldErrors?.name}
          </FieldError>
        </div>

        <div>
          <Label htmlFor="contact-email">Email address</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className={fieldClass}
            aria-invalid={state.fieldErrors?.email ? true : undefined}
            aria-describedby={
              state.fieldErrors?.email ? "contact-email-error" : undefined
            }
          />
          <FieldError id="contact-email-error">
            {state.fieldErrors?.email}
          </FieldError>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-phone">
            Phone <span className="font-normal text-muted">(optional)</span>
          </Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={fieldClass}
            aria-invalid={state.fieldErrors?.phone ? true : undefined}
            aria-describedby={
              state.fieldErrors?.phone ? "contact-phone-error" : undefined
            }
          />
          <FieldError id="contact-phone-error">
            {state.fieldErrors?.phone}
          </FieldError>
        </div>

        <div>
          <Label htmlFor="contact-subject">Subject</Label>
          <Input
            id="contact-subject"
            name="subject"
            required
            className={fieldClass}
            aria-invalid={state.fieldErrors?.subject ? true : undefined}
            aria-describedby={
              state.fieldErrors?.subject ? "contact-subject-error" : undefined
            }
          />
          <FieldError id="contact-subject-error">
            {state.fieldErrors?.subject}
          </FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className={fieldClass}
          aria-invalid={state.fieldErrors?.message ? true : undefined}
          aria-describedby="contact-message-hint contact-message-error"
        />
        <FieldHint id="contact-message-hint">
          Include the product name and quantity if your question is about a
          specific item.
        </FieldHint>
        <FieldError id="contact-message-error">
          {state.fieldErrors?.message}
        </FieldError>
      </div>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted">
          We use your details only to answer this enquiry.
        </p>
        <Button type="submit" disabled={pending} size="lg">
          {pending ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send aria-hidden="true" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
