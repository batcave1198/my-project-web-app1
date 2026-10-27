"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { deleteReview, setReviewStatus } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

export function ReviewModerationButtons({
  id,
  status,
  authorName,
}: {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  authorName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function updateStatus(next: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await setReviewStatus(id, next);
      if (result.status === "error") {
        window.alert(result.message);
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Delete the review by ${authorName}? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteReview(id);
      if (result.status === "error") {
        window.alert(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "APPROVED" && (
        <button
          type="button"
          onClick={() => updateStatus("APPROVED")}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md border border-success/30 px-2.5 py-1.5 text-xs font-semibold text-success hover:bg-success-soft disabled:opacity-60"
        >
          <Check aria-hidden="true" className="size-3.5" />
          Approve
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          type="button"
          onClick={() => updateStatus("REJECTED")}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md border border-line-strong px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-100 disabled:opacity-60"
        >
          <X aria-hidden="true" className="size-3.5" />
          Reject
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-danger/25 px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft disabled:opacity-60",
        )}
      >
        {pending ? (
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        ) : (
          <Trash2 aria-hidden="true" className="size-3.5" />
        )}
        Delete
      </button>
    </div>
  );
}
