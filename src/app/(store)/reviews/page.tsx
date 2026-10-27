import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewGallery } from "@/components/reviews/review-gallery";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Read verified customer reviews and photos for Ceylon Herbs and Spices products, and share your own experience.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const user = await getCurrentUser();

  const [reviews, products] = await Promise.all([
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
          <p className="eyebrow">Customer stories</p>
          <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
            Reviews from our kitchen
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
            Real ratings, honest words and customer photos. Reviews are checked
            by our team before they are published.
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
          <a href="#write-review">Share your review</a>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-line-strong bg-white px-6 py-16 text-center">
          <MessageSquare className="mx-auto size-9 text-gold-600" />
          <h2 className="mt-3 text-base font-semibold text-forest-900">
            No reviews published yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Be the first to share what you made with a Ceylon Herbs product.
            Approved reviews appear here with your photos.
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
          <p className="eyebrow">Add your experience</p>
          <h2 className="mt-2 text-2xl font-semibold text-forest-900">
            Tell other cooks what you think
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Choose the product you bought, give it one to five stars and add up
            to four photos. Your review is sent to our team for approval before
            it appears on the storefront.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            By submitting a review you confirm it reflects your own experience.
            Reviews that contain personal information, unrelated links or
            abusive language are not published.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/shop">Browse products</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/gallery">View photo gallery</Link>
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
