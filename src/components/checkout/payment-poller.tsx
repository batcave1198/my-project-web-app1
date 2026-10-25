"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refreshes the server component while PayHere's server-to-server notification
 * is still being processed. Stops after about a minute.
 */
export function PaymentPoller({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (attempts > 15) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, 4000);
    return () => clearInterval(timer);
  }, [active, router]);

  return null;
}
