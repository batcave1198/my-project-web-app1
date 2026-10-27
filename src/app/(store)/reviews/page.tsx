import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewGallery } from "@/components/reviews/review-gallery";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSiteCopy } from "@/lib/content";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Read verified customer reviews and photos for Ceylon Herbs and Spices products, and share your own experience.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const user = await getCurrentUser();

  const [reviews, products, copy] = await Promise.all([
    db.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 60,
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
        likes: {
          where: { userId: user?.id ?? "__guest__" },
          select: { id: true },
        },
        _count: { select: { likes: true } },
      },
    }),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getSiteCopy(),
  ]);

  const items = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    authorName: review.authorName,
    createdAtLabel: new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
    }).format(review.createdAt),
    isVerifiedPurchase: review.isVerifiedPurchase,
    imageUrls: review.imageUrls,
    likeCount: review._count.likes,
    liked: review.likes.length > 0,
    product: {
      name: review.product.name,
      slug: review.product.slug,
      imageUrl: review.product.images[0]?.url ?? null,
    },
  }));

  const average =
    items.length > 0
      ? items.reduce((sum, review) => sum + review.rating, 0) / items.length
      : 0;

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="grid items-end gap-6 border-b border-line pb-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">{copy.reviews.hero.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
            {copy.reviews.hero.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
            {copy.reviews.hero.body}
          </p>
          {items.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5 font-semibold text-forest-900">
                <Star className="size-4 fill-gold-500 text-gold-500" />
                {average.toFixed(1)} average
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {items.length} approved review{items.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
        <Button asChild>
          <a href="#write-review">{copy.reviews.hero.action}</a>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-line-strong bg-white px-6 py-16 text-center">
          <MessageSquare className="mx-auto size-9 text-gold-600" />
          <h2 className="mt-3 text-base font-semibold text-forest-900">
            {copy.reviews.empty.title}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {copy.reviews.empty.body}
          </p>
        </div>
      ) : (
        <ReviewGallery
          items={items}
          authenticated={Boolean(user)}
          className="mt-10"
        />
      )}

      <section className="mt-14 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">{copy.reviews.form.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-forest-900">
            {copy.reviews.form.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {copy.reviews.form.body}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            {copy.reviews.form.note}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/shop">{copy.reviews.form.browse}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/gallery">{copy.reviews.form.gallery}</Link>
            </Button>
          </div>
        </div>
        <ReviewForm
          products={products}
          authenticated={Boolean(user)}
          loginHref="/login?next=%2Freviews%23write-review"
        />
      </section>
    </div>
  );
}
