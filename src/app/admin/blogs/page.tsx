import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { BookOpen, ExternalLink, Film, ImageIcon, Plus } from "lucide-react";
import { DeleteBlogButton } from "@/components/admin/delete-blog-button";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Blogs & Recipes" };

export default async function AdminBlogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("/admin/blogs");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const where: Prisma.BlogPostWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const posts = await db.blogPost.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="mt-1 text-2xl font-semibold text-forest-900">
            Blogs & Recipes
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Publish recipes, serving ideas and product stories with photos and
            video. Link a post to products from the product edit page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/blogs" target="_blank">
              <ExternalLink className="size-4" />
              View blogs
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/blogs/new">
              <Plus className="size-4" />
              Add post
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white px-5 py-3">
        <form className="flex flex-wrap items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title or slug..."
            className="h-9 flex-1 rounded-md border border-line-strong px-3 text-sm sm:max-w-sm"
          />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
          {q && (
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/blogs">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-white px-6 py-16 text-center">
          <BookOpen className="mx-auto size-8 text-gold-600" />
          <p className="mt-3 text-sm font-medium text-forest-900">
            {q ? "No matching posts" : "No blog posts yet"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {q
              ? "Try a different title or slug."
              : "Add a recipe or story with photos, video and a full description."}
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/admin/blogs/new">
              <Plus className="size-4" />
              Add first post
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const cover = post.imageUrls[0];
            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-lg border border-line bg-white"
              >
                <div className="relative aspect-[4/3] bg-cream-200">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      {post.videoUrl ? (
                        <Film className="size-8" />
                      ) : (
                        <ImageIcon className="size-8" />
                      )}
                    </div>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-forest-950/80 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-cream-50 uppercase">
                    {post.imageUrls.length > 1
                      ? `${post.imageUrls.length} photos`
                      : "Post"}
                  </span>
                  {!post.isPublished && (
                    <span className="absolute right-3 top-3 rounded-full bg-gold-500 px-2 py-0.5 text-[0.65rem] font-bold text-forest-950">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="truncate text-sm font-semibold text-forest-900">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    {post._count.products} linked product
                    {post._count.products === 1 ? "" : "s"} · order{" "}
                    {post.sortOrder}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/blogs/${post.id}/edit`}
                        className="text-sm font-medium text-forest-900 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteBlogButton id={post.id} title={post.title} />
                    </div>
                    {post.isPublished && (
                      <Link
                        href={`/blogs/${post.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-forest-900"
                      >
                        View
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
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
