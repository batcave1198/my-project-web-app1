"use client";

import Image from "next/image";
import { useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

/**
 * Uploaded brand logo candidates, tried in order. The last upload wins by
 * being listed first, and the component falls through if a file is missing.
 */
const LOGO_CANDIDATES = ["/logo/logo.png", "/logo/logo.jpg", "/logo/logo.webp"];

/**
 * The uploaded brand logo, with an inline SVG fallback if no file is found.
 *
 * This has to be a client component: `onError` is an event handler, and event
 * handlers cannot be passed from a server component to `next/image`.
 */
export function LogoImage({
  markOnly = false,
  className,
}: {
  markOnly?: boolean;
  className?: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const src = LOGO_CANDIDATES[attempt];

  if (!src) {
    return <LogoMark className={cn("h-16 w-16", className)} />;
  }

  return (
    <Image
      key={src}
      src={src}
      alt="Ceylon Herbs and Spices"
      width={160}
      height={160}
      className={cn(
        "h-16 w-auto object-contain",
        markOnly && "h-16 w-16",
        className,
      )}
      priority
      onError={() => setAttempt((current) => current + 1)}
    />
  );
}
