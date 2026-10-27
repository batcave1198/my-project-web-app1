import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { serializeJsonLd } from "@/lib/json-ld";
import { formatMoneyDecimal, STORE_CURRENCY } from "@/lib/money";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSiteCopy } from "@/lib/content";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewGallery } from "@/components/reviews/review-gallery";
import { StarRating } from "@/components/reviews/star-rating";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, seoTitle: true, seoDescription: true, shortDescription: true, ogImageUrl: true, images: { take: 1 } },
  });
  if (!product) return { title: "Product not found" };
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.shortDescription || undefined;
  const image = product.ogImageUrl || product.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      blogPost: {
        select: {
          title: true,
          slug: true,
          isPublished: true,
        },
      },
    },
  });

  if (!product || product.status !== "PUBLISHED") notFound();

  const copy = await getSiteCopy();
  const currentUser = await getCurrentUser();
  const reviews = await db.review.findMany({
    where: { productId: product.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      likes: {
        where: { userId: currentUser?.id ?? "__guest__" },
        select: { id: true },
      },
      _count: { select: { likes: true } },
    },
  });

  const reviewItems = reviews.map((review) => ({
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
      name: product.name,
      slug: product.slug,
      imageUrl: product.images[0]?.url ?? null,
    },
  }));

  const purchaseVariants = product.variants.map((variant) => ({
    id: variant.id,
    label: variant.label,
    price: formatMoneyDecimal(variant.price.toString()),
    compareAt:
      variant.compareAtPrice && Number(variant.compareAtPrice) > Number(variant.price)
        ? formatMoneyDecimal(variant.compareAtPrice.toString())
        : null,
    stock: variant.stock,
    sku: variant.sku,
  }));

  const baseCompareAt =
    product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
      ? formatMoneyDecimal(product.compareAtPrice.toString())
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || product.name,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: STORE_CURRENCY,
      price: Number(product.price).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const related = await db.product.findMany({
    where: { status: "PUBLISHED", categoryId: product.categoryId, NOT: { id: product.id } },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      saleMode: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
    },
  });

  return (
    <div className="container-page py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <nav className="mb-8 text-sm text-muted">
        <Link href="/" className="hover:text-forest-900">Home</Link> / <Link href="/shop" className="hover:text-forest-900">Shop</Link> / <Link href={`/shop?category=${product.category.slug}`} className="hover:text-forest-900">{product.category.name}</Link> / <span className="text-forest-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {product.images[0] && (
            <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-cream-200">
              <Image src={product.images[0].url} alt={product.images[0].alt || product.name} fill sizes="(min-width:1024px)50vw,100vw" className="object-cover" priority />
            </div>
          )}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-md border border-line bg-cream-200">
                  <Image src={img.url} alt={img.alt || product.name} fill sizes="25vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
          {product.videos.length > 0 && (
            <video src={product.videos[0].url} controls className="w-full rounded-lg border border-line" />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted">{product.category.name}</p>
            <h1 className="mt-1 text-3xl font-semibold text-forest-900">{product.name}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
              {product.ratingCount > 0 ? (
                <>
                  <StarRating
                    rating={Number(product.ratingAverage)}
                    showValue
                    size="md"
                  />
                  <a
                    href="#reviews"
                    className="text-xs font-medium text-muted hover:text-forest-900 hover:underline"
                  >
                    {product.ratingCount} review
                    {product.ratingCount === 1 ? "" : "s"}
                  </a>
                </>
              ) : (
                <a
                  href="#reviews"
                  className="text-xs font-medium text-muted hover:text-forest-900 hover:underline"
                >
                  {copy.product.beFirstReview}
                </a>
              )}
            </div>
          </div>

          <ProductPurchasePanel
            productId={product.id}
            sku={product.sku}
            saleMode={product.saleMode}
            basePrice={formatMoneyDecimal(product.price.toString())}
            basePriceValue={product.price.toString()}
            baseCompareAt={baseCompareAt}
            baseCompareAtValue={
              product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
                ? product.compareAtPrice.toString()
                : null
            }
            baseStock={product.stock}
            variants={product.saleMode === "WEIGHT" ? [] : purchaseVariants}
          />

          {product.shortDescription && <p className="text-base leading-relaxed text-ink-soft">{product.shortDescription}</p>}

          {product.blogPost?.isPublished && (
            <Link
              href={`/blogs/${product.blogPost.slug}`}
              className="group flex items-center gap-3 rounded-lg border border-gold-500/35 bg-gold-500/10 p-4 transition-colors hover:border-gold-600/60 hover:bg-gold-500/15"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream-50 text-gold-700">
                <BookOpen className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.65rem] font-bold tracking-[0.14em] text-earth-700 uppercase">
                  {copy.product.recipeStory}
                </span>
                <span className="block truncate text-sm font-semibold text-forest-900 group-hover:underline">
                  {product.blogPost.title}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-earth-600 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          <div className="rounded-lg border border-line bg-cream-100/40 p-4 text-sm text-muted">
            <p className="font-medium text-forest-900">{copy.product.deliveryTitle}</p>
            <p className="mt-1">{copy.product.deliveryBody}</p>
          </div>
        </div>
      </div>

      {(product.description || product.specs.length > 0) && (
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {product.description && (
            <div>
              <h2 className="text-xl font-semibold text-forest-900">{copy.product.descriptionTitle}</h2>
              <div className="prose mt-4 max-w-none text-ink-soft whitespace-pre-line">{product.description}</div>
            </div>
          )}
          {product.specs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-forest-900">{copy.product.detailsTitle}</h2>
              <dl className="mt-4 divide-y divide-line rounded-lg border border-line">
                {product.specs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <dt className="text-muted">{s.label}</dt>
                    <dd className="text-forest-900">{s.value}</dd>
                  </div>
                ))}
                {product.origin && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Origin</dt><dd className="text-forest-900">{product.origin}</dd></div>}
                {product.ingredients && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Ingredients</dt><dd className="text-forest-900">{product.ingredients}</dd></div>}
                {product.packagingDetails && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Packaging</dt><dd className="text-forest-900">{product.packagingDetails}</dd></div>}
                {product.storageInstructions && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Storage</dt><dd className="text-forest-900">{product.storageInstructions}</dd></div>}
                {product.usageInstructions && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Usage</dt><dd className="text-forest-900">{product.usageInstructions}</dd></div>}
                {product.allergenInfo && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Allergen info</dt><dd className="text-forest-900">{product.allergenInfo}</dd></div>}
              </dl>
            </div>
          )}
        </div>
      )}

      <section
        id="reviews"
        className="mt-16 scroll-mt-28 border-t border-line pt-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{copy.product.reviewsEyebrow}</p>
            <h2 className="mt-1 text-2xl font-semibold text-forest-900">
              {copy.product.reviewsTitle}
            </h2>
            {product.ratingCount > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                <StarRating
                  rating={Number(product.ratingAverage)}
                  showValue
                  size="md"
                />
                <span>
                  {copy.product.reviewsBasedOn} {product.ratingCount} approved review
                  {product.ratingCount === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                {copy.product.reviewsEmpty}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/reviews">{copy.product.allReviews}</Link>
            </Button>
            <Button asChild>
              <a href="#write-review">{copy.product.writeReview}</a>
            </Button>
          </div>
        </div>

        {reviewItems.length > 0 ? (
          <ReviewGallery
            items={reviewItems}
            authenticated={Boolean(currentUser)}
            showProduct={false}
            loginHref={`/login?next=${encodeURIComponent(
              `/shop/${product.slug}#reviews`,
            )}`}
            className="mt-6"
          />
        ) : (
          <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-cream-100/40 px-5 py-8 text-center">
            <p className="text-sm font-medium text-forest-900">
              {copy.product.noReviewsTitle}
            </p>
            <p className="mt-1 text-xs text-muted">
              {copy.product.noReviewsBody}
            </p>
          </div>
        )}

        <div className="mt-8 max-w-3xl">
          <ReviewForm
            products={[{ id: product.id, name: product.name }]}
            initialProductId={product.id}
            fixedProduct
            authenticated={Boolean(currentUser)}
            loginHref={`/login?next=${encodeURIComponent(
              `/shop/${product.slug}#write-review`,
            )}`}
          />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-forest-900">{copy.product.relatedTitle}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => {
              const img = p.images[0];
              const sale = p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price);
              return (
                <Link key={p.id} href={`/shop/${p.slug}`} className="group overflow-hidden rounded-lg border border-line bg-white">
                  <div className="relative aspect-square bg-cream-200">
                    {img?.url ? <Image src={img.url} alt={img.alt || p.name} fill className="object-cover" /> : <div className="flex h-full items-center justify-center text-muted">No image</div>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-forest-900 group-hover:underline">{p.name}</p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-forest-900">{formatMoneyDecimal(p.price.toString())}</span>
                      {p.saleMode === "WEIGHT" && (
                        <span className="text-xs text-muted">/ 100g</span>
                      )}
                      {sale && <span className="text-xs text-muted line-through">{formatMoneyDecimal(p.compareAtPrice!.toString())}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
