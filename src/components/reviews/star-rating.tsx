import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  showValue = false,
  className,
  size = "sm",
}: {
  rating: number;
  showValue?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const rounded = Math.round(rating);
  const iconClass = size === "md" ? "size-5" : "size-4";

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              iconClass,
              star <= rounded
                ? "fill-gold-500 text-gold-500"
                : "fill-transparent text-cream-400",
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs font-semibold text-earth-600">
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
