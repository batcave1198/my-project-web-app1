"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/dal";
import { slugify } from "@/lib/slug";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().min(2, "Slug is required"),
  description: z.string().trim().optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  imageUrl: z.string().trim().optional().or(z.literal("")),
  imageAlt: z.string().trim().optional().or(z.literal("")),
  seoTitle: z.string().trim().optional().or(z.literal("")),
  seoDescription: z.string().trim().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export type CategoryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function emptyToNull(v?: string) {
  if (!v) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export async function saveCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireStaff("/admin/categories");

  const parsed = categorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || "",
    parentId: formData.get("parentId") || "",
    imageUrl: formData.get("imageUrl") || "",
    imageAlt: formData.get("imageAlt") || "",
    seoTitle: formData.get("seoTitle") || "",
    seoDescription: formData.get("seoDescription") || "",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please fix the errors below.", fieldErrors };
  }

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);

  try {
    if (data.id) {
      await db.category.update({
        where: { id: data.id },
        data: {
          name: data.name,
          slug,
          description: emptyToNull(data.description),
          parentId: emptyToNull(data.parentId),
          imageUrl: emptyToNull(data.imageUrl),
          imageAlt: emptyToNull(data.imageAlt),
          seoTitle: emptyToNull(data.seoTitle),
          seoDescription: emptyToNull(data.seoDescription),
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        },
      });
    } else {
      await db.category.create({
        data: {
          name: data.name,
          slug,
          description: emptyToNull(data.description),
          parentId: emptyToNull(data.parentId),
          imageUrl: emptyToNull(data.imageUrl),
          imageAlt: emptyToNull(data.imageAlt),
          seoTitle: emptyToNull(data.seoTitle),
          seoDescription: emptyToNull(data.seoDescription),
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        },
      });
    }

    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    revalidatePath("/");
    return { status: "success", message: "Category saved." };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to save category. Slug might already exist." };
  }
}

export async function deleteCategory(id: string) {
  await requireStaff("/admin/categories");
  try {
    await db.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    revalidatePath("/");
    return { status: "success" as const };
  } catch {
    return { status: "error" as const, message: "Cannot delete category with products." };
  }
}
