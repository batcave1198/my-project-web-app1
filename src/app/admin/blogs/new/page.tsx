import type { Metadata } from "next";
import { BlogForm } from "@/components/admin/blog-form";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "New Blog Post" };

export default async function NewBlogPostPage() {
  await requireStaff("/admin/blogs");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="eyebrow">Content</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">
          Add blog post
        </h1>
        <p className="mt-1 text-sm text-muted">
          Create a recipe or story for the public Blogs & Recipes page.
        </p>
      </div>
      <BlogForm />
    </div>
  );
}
