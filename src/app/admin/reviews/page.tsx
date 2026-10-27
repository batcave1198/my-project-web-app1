import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, ReviewStatus } from "@prisma/client";
import { BadgeCheck, MessageSquare, Star } from "lucide-react";
import { ReviewModerationButtons } from "@/components/admin/review-moderation-buttons";
import { StarRating } from "@/components/reviews/star-rating";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Reviews" };

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const statusTone: Record<ReviewStatus, string> = {
  PENDING: "bg-gold-200 text-gold-700",
  APPROVED: "bg-success-soft text-success",
  REJECTED: "bg-danger-soft text-danger",
};

const filters = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("/admin/reviews");
  const params = await searchParams;
  const statusParam =
    typeof params.status === "string" ? params.status : "";
  const status = ["PENDING", "APPROVED", "REJECTED"].includes(statusParam)
    ? (statusParam as ReviewStatus)
    : undefined;

  const where: Prisma.ReviewWhereInput = status ? { status } : {};
  const [reviews, counts] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            images: {
              take: 1,
              orderBy: { sortOrder: "asc" },
              select: { url: true },
            },
          },
        },
        _count: { select: { likes: true } },
      },
    }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countMap = new Map(counts.map((item) => [item.status, item._count._all]));
  const total = counts.reduce((sum, item) => sum + item._count._all, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">
          Product reviews
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Approve, reject or delete customer reviews. Approved reviews update the
          product star rating and appear on the storefront.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const selected = statusParam === filter.value;
          const count =
            filter.value === ""
              ? total
              : (countMap.get(filter.value as ReviewStatus) ?? 0);
          const href = filter.value
            ? `/admin/reviews?status=${filter.value}`
            : "/admin/reviews";
          return (
            <Link
              key={filter.label}
              href={href}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-forest-900 bg-forest-900 text-cream-50"
                  : "border-line bg-white text-ink-soft hover:border-forest-900/30"
              }`}
            >
              {filter.label}
              <span
                className={`rounded-full px-1.5 text-[0.65rem] font-bold ${
                  selected ? "bg-cream-50/15" : "bg-cream-200 text-forest-800"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-white px-6 py-16 text-center">
          <MessageSquare className="mx-auto size-8 text-gold-600" />
          <p className="mt-3 text-sm font-medium text-forest-900">
            No {status ? status.toLowerCase() : ""} reviews
          </p>
          <p className="mt-1 text-xs text-muted">
            Customer reviews submitted from the product and reviews pages appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-lg border border-line bg-white p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold tracking-wide uppercase ${statusTone[review.status]}`}
                    >
                      {review.status}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <BadgeCheck className="size-3.5" />
                        Verified purchase
                      </span>
                    )}
                  </div>

                  {review.title && (
                    <h2 className="mt-2 text-base font-semibold text-forest-900">
                      {review.title}
                    </h2>
                  )}
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                    {review.body}
                  </p>

                  <p className="mt-3 text-xs text-muted">
                    {review.authorName} · {review.authorEmail} ·{" "}
                    {formatDate(review.createdAt)}
                  </p>

                  {review.imageUrls.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {review.imageUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative size-16 overflow-hidden rounded-md border border-line"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full shrink-0 rounded-md border border-line bg-cream-100/50 p-4 lg:w-64">
                  <Link
                    href={`/shop/${review.product.slug}`}
                    target="_blank"
                    className="flex items-center gap-3"
                  >
                    {review.product.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.product.images[0].url}
                        alt=""
                        className="size-11 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex size-11 items-center justify-center rounded-md bg-cream-200">
                        <Star className="size-4 text-muted" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-forest-900">
                        {review.product.name}
                      </span>
                      <span className="block text-xs text-muted">
                        {review._count.likes} likes
                      </span>
                    </span>
                  </Link>

                  <div className="mt-4">
                    <ReviewModerationButtons
                      id={review.id}
                      status={review.status}
                      authorName={review.authorName}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
