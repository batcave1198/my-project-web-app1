"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { BadgeCheck, ImageIcon, Star, X } from "lucide-react";
import { StarRating } from "@/components/reviews/star-rating";
import { ReviewLikeButton } from "@/components/reviews/review-like-button";
import { cn } from "@/lib/utils";

export type ReviewGalleryItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  createdAtLabel: string;
  isVerifiedPurchase: boolean;
  imageUrls: string[];
  likeCount: number;
  liked: boolean;
  product: {
    name: string;
    slug: string;
    imageUrl: string | null;
  };
};

export function ReviewGallery({
  items,
  authenticated,
  showProduct = true,
  className,
  loginHref = "/login?next=%2Freviews",
}: {
  items: ReviewGalleryItem[];
  authenticated: boolean;
  showProduct?: boolean;
  className?: string;
  loginHref?: string;
}) {
  const [selected, setSelected] = useState<ReviewGalleryItem | null>(null);

  return (
    <>
      <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>
        {items.map((review) => {
          const preview = review.imageUrls[0] ?? review.product.imageUrl;
          const hasReviewPhotos = review.imageUrls.length > 0;

          return (
            <article
              key={review.id}
              className="flex overflow-hidden rounded-lg border border-line bg-white shadow-[0_1px_0_rgb(20_33_26/0.02)]"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="relative aspect-[4/3] bg-cream-200">
                  {preview ? (
                    hasReviewPhotos ? (
                      <button
                        type="button"
                        onClick={() => setSelected(review)}
                        className="group absolute inset-0 text-left"
                        aria-label={`Open photos for ${review.title || "this review"}`}
                      >
                        <Image
                          src={preview}
                          alt={review.title ?? `Photo from ${review.authorName}`}
                          fill
                          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        {review.imageUrls.length > 1 && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-forest-950/80 px-2 py-1 text-[0.65rem] font-semibold text-cream-50">
                            <ImageIcon aria-hidden="true" className="size-3" />
                            {review.imageUrls.length}
                          </span>
                        )}
                      </button>
                    ) : (
                      <Image
                        src={preview}
                        alt={review.product.name}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover opacity-80"
                      />
                    )
                  ) : (
                    <span className="flex h-full items-center justify-center text-cream-400">
                      <Star aria-hidden="true" className="size-9" />
                    </span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-cream-50/95 px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-forest-900 uppercase shadow-sm">
                    {review.rating}/5
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <StarRating rating={review.rating} />
                  {review.title && (
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-forest-900">
                      {review.title}
                    </h3>
                  )}
                  <p className="mt-1.5 line-clamp-5 text-sm leading-relaxed text-ink-soft">
                    {review.body}
                  </p>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="font-semibold text-forest-900">
                        {review.authorName}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span
                          className="inline-flex items-center gap-0.5 text-success"
                          title="Verified purchase"
                        >
                          <BadgeCheck aria-hidden="true" className="size-3.5" />
                          <span className="sr-only">Verified purchase</span>
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{review.createdAtLabel}</span>
                    </div>

                    {showProduct && (
                      <Link
                        href={`/shop/${review.product.slug}`}
                        className="mt-2 block truncate text-xs font-semibold text-earth-700 hover:underline"
                      >
                        {review.product.name}
                      </Link>
                    )}

                    <div className="mt-3">
                      <ReviewLikeButton
                        reviewId={review.id}
                        initialLiked={review.liked}
                        initialCount={review.likeCount}
                        authenticated={authenticated}
                        loginHref={loginHref}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog.Root
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-forest-950/80 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-cream-50 shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
              <Dialog.Title className="truncate text-sm font-semibold text-forest-900">
                {selected?.title || `Review by ${selected?.authorName ?? "customer"}`}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-forest-900/5 hover:text-forest-900"
                  aria-label="Close review photos"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {selected?.imageUrls.map((url, index) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-md bg-cream-200"
                >
                  <Image
                    src={url}
                    alt={`Photo ${index + 1} from ${selected.authorName}`}
                    fill
                    sizes="(min-width: 640px) 45vw, 90vw"
                    className="object-contain"
                  />
                </div>
              ))}
            </div>

            <Dialog.Description className="border-t border-line px-5 py-4 text-sm leading-relaxed text-ink-soft">
              {selected?.body}
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
