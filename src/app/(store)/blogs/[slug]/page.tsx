import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, ShoppingBag } from "lucide-react";
import { BlogPhotoGallery } from "@/components/blogs/blog-photo-gallery";
import { StarRating } from "@/components/reviews/star-rating";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getVideoEmbedUrl, isDirectVideo } from "@/lib/gallery";
import { serializeJsonLd } from "@/lib/json-ld";
import { formatMoneyDecimal } from "@/lib/money";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, excerpt: true, content: true, imageUrls: true },
  });
  if (!post) return { title: "Story not found" };
  const description =
    post.excerpt || post.content.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blogs/${slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      images: post.imageUrls[0] ? [{ url: post.imageUrls[0] }] : [],
    },
  };
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  }).format(value);
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.blogPost.findFirst({
    where: { slug, isPublished: true },
  });
  if (!post) notFound();

  const products = await db.product.findMany({
    where: { blogPostId: post.id, status: "PUBLISHED" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      saleMode: true,
      ratingAverage: true,
      ratingCount: true,
      images: {
        take: 1,
        orderBy: { sortOrder: "asc" },
        select: { url: true, alt: true },
      },
    },
  });

  const embedUrl = post.videoUrl ? getVideoEmbedUrl(post.videoUrl) : null;
  const videoIsDirect = post.videoUrl ? isDirectVideo(post.videoUrl) : false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.imageUrls,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "Ceylon Herbs and Spices",
    },
  };

  return (
    <div className="container-page py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <Link
        href="/blogs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-forest-900"
      >
        <ArrowLeft className="size-4" />
        Back to blogs & recipes
      </Link>

      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">Recipe & story</p>
        <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">
            {post.excerpt}
          </p>
        )}
        <p className="mt-4 text-sm text-muted">
          Published {formatDate(post.createdAt)}
          {products.length > 0 &&
            ` · ${products.length} linked product${
              products.length === 1 ? "" : "s"
            }`}
        </p>
      </header>

      {post.imageUrls.length > 0 && (
        <div className="mt-8">
          <BlogPhotoGallery images={post.imageUrls} title={post.title} />
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          {embedUrl && (
            <div className="mb-8 overflow-hidden rounded-lg border border-line bg-forest-950">
              <div className="relative aspect-video">
                {videoIsDirect ? (
                  <video
                    src={post.videoUrl!}
                    controls
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <iframe
                    src={embedUrl}
                    title={`${post.title} video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                )}
              </div>
            </div>
          )}

          <div className="prose max-w-none whitespace-pre-line text-base leading-relaxed text-ink-soft">
            {post.content}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-line bg-cream-100/50 p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-gold-600" />
              <h2 className="text-base font-semibold text-forest-900">
                Cook with these
              </h2>
            </div>

            {products.length === 0 ? (
              <div className="mt-3">
                <p className="text-sm leading-relaxed text-muted">
                  This story is not linked to a product yet. Browse our range to
                  find the ingredients for your next meal.
                </p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href="/shop">Explore the shop</Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/shop/${product.slug}`}
                      className="group flex gap-3 rounded-md border border-line bg-white p-2.5 transition-colors hover:border-forest-900/20"
                    >
                      <span className="relative size-16 shrink-0 overflow-hidden rounded bg-cream-200">
                        {product.images[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-muted">
                            <ShoppingBag className="size-5" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-forest-900 group-hover:underline">
                          {product.name}
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold text-forest-900">
                          {formatMoneyDecimal(product.price.toString())}
                          {product.saleMode === "WEIGHT" && (
                            <span className="font-normal text-muted"> / 100g</span>
                          )}
                        </span>
                        {product.ratingCount > 0 && (
                          <span className="mt-1 block">
                            <StarRating
                              rating={Number(product.ratingAverage)}
                              showValue
                            />
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-dashed border-line-strong p-5">
            <p className="text-sm font-semibold text-forest-900">
              Made this recipe?
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Leave a review with a photo on the product page. Approved photos
              appear in our customer gallery.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/reviews">Read customer reviews</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
