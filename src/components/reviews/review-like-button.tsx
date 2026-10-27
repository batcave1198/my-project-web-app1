"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toggleReviewLike } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

export function ReviewLikeButton({
  reviewId,
  initialLiked,
  initialCount,
  authenticated,
  loginHref = "/login?next=%2Freviews",
}: {
  reviewId: string;
  initialLiked: boolean;
  initialCount: number;
  authenticated: boolean;
  loginHref?: string;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!authenticated) {
    return (
      <Link
        href={loginHref}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-earth-400 hover:text-earth-700"
        aria-label={`Sign in to like this review. ${count} likes`}
      >
        <Heart aria-hidden="true" className="size-3.5" />
        {count}
      </Link>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await toggleReviewLike(reviewId);
      if (result.status === "success") {
        setLiked(result.liked);
        setCount(result.count);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={liked}
        aria-label={`${liked ? "Unlike" : "Like"} this review. ${count} likes`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
          liked
            ? "border-earth-400/40 bg-earth-500/10 text-earth-700"
            : "border-line text-ink-soft hover:border-earth-400 hover:text-earth-700",
        )}
      >
        {pending ? (
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        ) : (
          <Heart
            aria-hidden="true"
            className={cn("size-3.5", liked && "fill-current")}
          />
        )}
        {count}
      </button>
      {error && <span className="text-[0.65rem] text-danger">{error}</span>}
    </span>
  );
}
