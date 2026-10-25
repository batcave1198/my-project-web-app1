"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold text-forest-900 sm:text-3xl">
          We could not load this page
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The problem is on our side. Try again, or return to the homepage.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RefreshCcw aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
