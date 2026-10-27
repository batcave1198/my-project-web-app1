"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/dal";
import { recordAuditLog } from "@/lib/admin/audit";
import { getVideoEmbedUrl } from "@/lib/gallery";
import { slugify } from "@/lib/slug";

const blogSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Title is required").max(160),
  slug: z.string().trim().min(2, "Slug is required").max(180),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().min(10, "Write at least 10 characters").max(20000),
  videoUrl: z.string().trim().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isPublished: z.coerce.boolean().default(true),
});

export type BlogActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function parseImageUrls(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed
          .filter((url): url is string => typeof url === "string")
          .map((url) => url.trim())
          .filter(
            (url) =>
              /^\/(uploads|images)\//.test(url) &&
              !url.startsWith("//") &&
              !url.includes("..") &&
              !url.includes("\\"),
          ),
      ),
    ].slice(0, 10);
  } catch {
    return [];
  }
}

function emptyToNull(value?: string) {
  return value && value.trim() !== "" ? value.trim() : null;
}

export async function saveBlogPost(
  _prev: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  const actor = await requireStaff("/admin/blogs");

  const parsed = blogSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") || "",
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl") || "",
    sortOrder: formData.get("sortOrder") || 0,
    isPublished: formData.get("isPublished") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  if (data.videoUrl && !getVideoEmbedUrl(data.videoUrl)) {
    return {
      status: "error",
      message: "Enter a valid YouTube, Vimeo or direct video URL.",
      fieldErrors: { videoUrl: "This video link cannot be embedded." },
    };
  }

  const slug = slugify(data.slug || data.title);
  if (!slug) {
    return {
      status: "error",
      fieldErrors: { slug: "Enter a valid URL slug." },
      message: "Please check the highlighted fields.",
    };
  }

  const payload = {
    title: data.title,
    slug,
    excerpt: emptyToNull(data.excerpt),
    content: data.content,
    imageUrls: parseImageUrls(formData.get("imageUrls")),
    videoUrl: emptyToNull(data.videoUrl),
    sortOrder: data.sortOrder,
    isPublished: data.isPublished,
  };

  try {
    const saved = data.id
      ? await db.blogPost.update({ where: { id: data.id }, data: payload })
      : await db.blogPost.create({ data: payload });

    await recordAuditLog({
      actorUserId: actor.id,
      action: data.id ? "blog.update" : "blog.create",
      entityType: "BlogPost",
      entityId: saved.id,
      metadata: { title: saved.title, slug: saved.slug },
    });

    revalidatePath("/admin/blogs");
    revalidatePath("/blogs");
    revalidatePath(`/blogs/${saved.slug}`);
    return {
      status: "success",
      message: data.id ? "Blog post saved." : "Blog post created.",
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        status: "error",
        fieldErrors: { slug: "That slug is already in use." },
        message: "Please check the highlighted fields.",
      };
    }
    console.error("[blogs] save failed", error);
    return { status: "error", message: "Could not save this blog post." };
  }
}

export async function deleteBlogPost(id: string) {
  const actor = await requireStaff("/admin/blogs");
  const post = await db.blogPost.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, _count: { select: { products: true } } },
  });
  if (!post) return { status: "error" as const, message: "Post not found." };

  try {
    await db.blogPost.delete({ where: { id } });
    await recordAuditLog({
      actorUserId: actor.id,
      action: "blog.delete",
      entityType: "BlogPost",
      entityId: post.id,
      metadata: {
        title: post.title,
        slug: post.slug,
        linkedProducts: post._count.products,
      },
    });
    revalidatePath("/admin/blogs");
    revalidatePath("/blogs");
    revalidatePath(`/blogs/${post.slug}`);
    revalidatePath("/shop");
    return { status: "success" as const };
  } catch (error) {
    console.error("[blogs] delete failed", error);
    return { status: "error" as const, message: "Could not delete this post." };
  }
}
