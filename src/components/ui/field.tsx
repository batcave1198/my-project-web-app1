import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const fieldBase =
  "block w-full rounded-md border border-line-strong bg-white px-3.5 text-ink shadow-[inset_0_1px_0_rgb(20_33_26/0.03)] transition-colors placeholder:text-muted/70 hover:border-earth-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20 disabled:cursor-not-allowed disabled:bg-cream-100 disabled:text-muted aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

export function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldBase, "h-11 text-sm", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  rows = 5,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      data-slot="textarea"
      className={cn(fieldBase, "resize-y py-3 text-sm", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(fieldBase, "h-11 cursor-pointer pr-9 text-sm", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "block text-sm font-medium text-ink-soft select-none",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({
  children,
  id,
  className,
}: {
  children?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn("mt-1.5 text-sm text-danger", className)}>
      {children}
    </p>
  );
}

export function FieldHint({
  children,
  id,
  className,
}: {
  children?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <p id={id} className={cn("mt-1.5 text-xs text-muted", className)}>
      {children}
    </p>
  );
}

export function Checkbox({
  className,
  label,
  ...props
}: React.ComponentProps<"input"> & { label: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft">
      <input
        type="checkbox"
        className={cn(
          "mt-0.5 size-4 shrink-0 rounded border-line-strong text-forest-800 accent-forest-800",
          className,
        )}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
