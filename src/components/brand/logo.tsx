import Link from "next/link";
import { LogoImage } from "@/components/brand/logo-image";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

export { LogoMark };

type LogoProps = {
  /** Hide the wordmark and render only the emblem. */
  markOnly?: boolean;
  className?: string;
  /** Cream text for use on dark forest backgrounds. */
  tone?: "dark" | "light";
  href?: string | null;
};

/**
 * Brand lockup: the uploaded logo from public/logo/logo.png (with an inline SVG
 * fallback), beside the wordmark set in the display face.
 */
export function Logo({
  markOnly = false,
  className,
  tone = "dark",
  href = "/",
}: LogoProps) {
  const wordColor = tone === "light" ? "text-cream-100" : "text-forest-900";
  const subColor = tone === "light" ? "text-cream-300" : "text-earth-500";

  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="flex h-16 w-16 shrink-0 items-center justify-center">
        <LogoImage markOnly={markOnly} />
      </span>
      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-[1.35rem] font-semibold tracking-[0.16em]",
              wordColor,
            )}
          >
            CEYLON
          </span>
          <span
            className={cn(
              "mt-1 text-[0.6rem] font-semibold tracking-[0.32em] uppercase",
              subColor,
            )}
          >
            Herbs &amp; Spices
          </span>
        </span>
      )}
    </span>
  );

  if (!href) {
    return <span aria-label="Ceylon Herbs and Spices">{content}</span>;
  }

  return (
    <Link
      href={href}
      aria-label="Ceylon Herbs and Spices — home"
      className="inline-flex rounded-sm"
    >
      {content}
    </Link>
  );
}
