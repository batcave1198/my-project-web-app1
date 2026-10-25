import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertTone = "success" | "error" | "info";

const toneStyles: Record<AlertTone, string> = {
  success: "border-success/25 bg-success-soft text-success",
  error: "border-danger/25 bg-danger-soft text-danger",
  info: "border-forest-900/15 bg-cream-200/70 text-forest-900",
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm",
        toneStyles[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1")}>{children}</div>}
      </div>
    </div>
  );
}
