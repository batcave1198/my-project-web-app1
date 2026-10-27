import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Film, ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteCopy } from "@/lib/content";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Blogs & Recipes",
  description:
    "Sri Lankan recipes, serving ideas and stories from Ceylon Herbs and Spices.",
  alternates: { canonical: "/blogs" },
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(value);
}

export default async function BlogsPage() {
  const [posts, copy] = await Promise.all([
    db.blogPost.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { products: true } },
      },
    }),
    getSiteCopy(),
  ]);

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="grid items-end gap-6 border-b border-line pb-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">{copy.blogs.hero.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
            {copy.blogs.hero.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
            {copy.blogs.hero.body}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/reviews">
            <Star className="size-4" />
            {copy.blogs.hero.action}
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-line-strong bg-white px-6 py-16 text-center">
          <BookOpen className="mx-auto size-9 text-gold-600" />
          <h2 className="mt-3 text-base font-semibold text-forest-900">
            {copy.blogs.empty.title}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {copy.blogs.empty.body}
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/shop">{copy.blogs.empty.action}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const cover = post.imageUrls[0];
            return (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-[0_1px_0_rgb(20_33_26/0.02)]"
              >
                <Link
                  href={`/blogs/${post.slug}`}
                  className="relative block aspect-[4/3] overflow-hidden bg-cream-200"
                >
                  {cover ? (
                    <Image
                      src={cover}
                      alt={post.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted">
                      {post.videoUrl ? (
                        <Film className="size-9" />
                      ) : (
                        <ImageIcon className="size-9" />
                      )}
                    </span>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-forest-950/80 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-cream-50 uppercase">
                    <BookOpen className="size-3" />
                    Recipe & story
                  </span>
                  {post.videoUrl && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-cream-50/90 px-2 py-1 text-[0.65rem] font-semibold text-forest-900">
                      <Film className="size-3" />
                      Video
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-muted">{formatDate(post.createdAt)}</p>
                  <h2 className="mt-1.5 text-lg font-semibold text-forest-900">
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                    {post.excerpt ||
                      post.content.replace(/\s+/g, " ").slice(0, 180)}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs text-muted">
                      {post._count.products > 0
                        ? `${post._count.products} linked product${
                            post._count.products === 1 ? "" : "s"
                          }`
                        : "Read the story"}
                    </span>
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-earth-700 hover:underline"
                    >
                      Read more
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
