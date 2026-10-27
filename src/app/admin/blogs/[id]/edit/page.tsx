import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/blog-form";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit Blog Post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("/admin/blogs");
  const { id } = await params;

  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="eyebrow">Content</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">
          Edit blog post
        </h1>
        <p className="mt-1 text-sm text-muted">{post.title}</p>
      </div>
      <BlogForm
        item={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          imageUrls: post.imageUrls,
          videoUrl: post.videoUrl,
          sortOrder: post.sortOrder,
          isPublished: post.isPublished,
        }}
      />
    </div>
  );
}
