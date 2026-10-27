"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/dal";
import { slugify } from "@/lib/slug";
import { recordAuditLog } from "@/lib/admin/audit";
import { Prisma } from "@prisma/client";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().min(2, "Slug is required"),
  sku: z.string().trim().min(2, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional().or(z.literal("")),
  blogPostId: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  saleMode: z.enum(["UNIT", "WEIGHT"]).default("UNIT"),
  shortDescription: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price is required"),
  compareAtPrice: z.coerce.number().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockAlert: z.coerce.number().int().min(0).default(5),
  ingredients: z.string().trim().optional().or(z.literal("")),
  origin: z.string().trim().optional().or(z.literal("")),
  packagingDetails: z.string().trim().optional().or(z.literal("")),
  storageInstructions: z.string().trim().optional().or(z.literal("")),
  usageInstructions: z.string().trim().optional().or(z.literal("")),
  allergenInfo: z.string().trim().optional().or(z.literal("")),
  tags: z.string().trim().optional().or(z.literal("")),
  seoTitle: z.string().trim().optional().or(z.literal("")),
  seoDescription: z.string().trim().optional().or(z.literal("")),
  ogImageUrl: z.string().trim().optional().or(z.literal("")),
  isFeatured: z.coerce.boolean().default(false),
});

export type ProductActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function emptyToNull(v?: string | number) {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  return v;
}

/**
 * Images are submitted as `images[0].url`, `images[0].alt`, and so on.
 * Only local upload paths are accepted, so a staff account cannot inject an
 * arbitrary remote URL into an <Image> tag.
 */
function parseImages(formData: FormData) {
  const entries = new Map<number, { url: string; alt: string }>();

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const match = /^images\[(\d+)\]\.(url|alt)$/.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    if (!Number.isInteger(index) || index < 0) continue;
    const current = entries.get(index) ?? { url: "", alt: "" };
    if (match[2] === "url") current.url = value.trim();
    else current.alt = value.trim();
    entries.set(index, current);
  }

  return [...entries.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, image]) => image)
    .filter(
      (image) =>
        image.url.startsWith("/") &&
        !image.url.startsWith("//") &&
        !image.url.includes("..") &&
        !image.url.includes("\\") &&
        /^\/(uploads|images)\//.test(image.url),
    )
    .slice(0, 12);
}

export async function saveProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const actor = await requireStaff("/admin/products");

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    brandId: formData.get("brandId") || "",
    blogPostId: formData.get("blogPostId") || "",
    status: formData.get("status"),
    saleMode: formData.get("saleMode") || "UNIT",
    shortDescription: formData.get("shortDescription") || "",
    description: formData.get("description") || "",
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || "",
    stock: formData.get("stock") || 0,
    lowStockAlert: formData.get("lowStockAlert") || 5,
    ingredients: formData.get("ingredients") || "",
    origin: formData.get("origin") || "",
    packagingDetails: formData.get("packagingDetails") || "",
    storageInstructions: formData.get("storageInstructions") || "",
    usageInstructions: formData.get("usageInstructions") || "",
    allergenInfo: formData.get("allergenInfo") || "",
    tags: formData.get("tags") || "",
    seoTitle: formData.get("seoTitle") || "",
    seoDescription: formData.get("seoDescription") || "",
    ogImageUrl: formData.get("ogImageUrl") || "",
    isFeatured: formData.get("isFeatured") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the errors below.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);
  const tags = data.tags
    ? data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const images = parseImages(formData).map((image, index) => ({
    url: image.url,
    alt: image.alt.trim() === "" ? null : image.alt.trim(),
    sortOrder: index,
  }));

  const blogPostId = emptyToNull(data.blogPostId) as string | null;
  if (blogPostId) {
    const postExists = await db.blogPost.count({ where: { id: blogPostId } });
    if (!postExists) {
      return {
        status: "error",
        fieldErrors: { blogPostId: "Choose a valid blog post." },
        message: "Please fix the errors below.",
      };
    }
  }

  try {
    let saved: { id: string; name: string; slug: string };
    if (data.id) {
      saved = await db.product.update({
        where: { id: data.id },
        select: { id: true, name: true, slug: true },
        data: {
          name: data.name,
          slug,
          sku: data.sku,
          categoryId: data.categoryId,
          brandId: emptyToNull(data.brandId) as string | null,
          blogPostId,
          status: data.status,
          saleMode: data.saleMode,
          shortDescription: emptyToNull(data.shortDescription) as string | null,
          description: emptyToNull(data.description) as string | null,
          price: new Prisma.Decimal(data.price),
          compareAtPrice:
            data.compareAtPrice === "" || data.compareAtPrice === undefined
              ? null
              : new Prisma.Decimal(data.compareAtPrice as number),
          stock: data.stock,
          lowStockAlert: data.lowStockAlert,
          ingredients: emptyToNull(data.ingredients) as string | null,
          origin: emptyToNull(data.origin) as string | null,
          packagingDetails: emptyToNull(data.packagingDetails) as string | null,
          storageInstructions: emptyToNull(data.storageInstructions) as
            string | null,
          usageInstructions: emptyToNull(data.usageInstructions) as
            string | null,
          allergenInfo: emptyToNull(data.allergenInfo) as string | null,
          tags,
          seoTitle: emptyToNull(data.seoTitle) as string | null,
          seoDescription: emptyToNull(data.seoDescription) as string | null,
          ogImageUrl: emptyToNull(data.ogImageUrl) as string | null,
          isFeatured: data.isFeatured,
          publishedAt: data.status === "PUBLISHED" ? new Date() : null,
          images: {
            deleteMany: {},
            create: images,
          },
        },
      });
    } else {
      saved = await db.product.create({
        select: { id: true, name: true, slug: true },
        data: {
          name: data.name,
          slug,
          sku: data.sku,
          categoryId: data.categoryId,
          brandId: emptyToNull(data.brandId) as string | null,
          blogPostId,
          status: data.status,
          saleMode: data.saleMode,
          shortDescription: emptyToNull(data.shortDescription) as string | null,
          description: emptyToNull(data.description) as string | null,
          price: new Prisma.Decimal(data.price),
          compareAtPrice:
            data.compareAtPrice === "" || data.compareAtPrice === undefined
              ? null
              : new Prisma.Decimal(data.compareAtPrice as number),
          stock: data.stock,
          lowStockAlert: data.lowStockAlert,
          ingredients: emptyToNull(data.ingredients) as string | null,
          origin: emptyToNull(data.origin) as string | null,
          packagingDetails: emptyToNull(data.packagingDetails) as string | null,
          storageInstructions: emptyToNull(data.storageInstructions) as
            string | null,
          usageInstructions: emptyToNull(data.usageInstructions) as
            string | null,
          allergenInfo: emptyToNull(data.allergenInfo) as string | null,
          tags,
          seoTitle: emptyToNull(data.seoTitle) as string | null,
          seoDescription: emptyToNull(data.seoDescription) as string | null,
          ogImageUrl: emptyToNull(data.ogImageUrl) as string | null,
          isFeatured: data.isFeatured,
          publishedAt: data.status === "PUBLISHED" ? new Date() : null,
          images: images.length > 0 ? { create: images } : undefined,
        },
      });
    }

    await recordAuditLog({
      actorUserId: actor.id,
      action: data.id ? "product.update" : "product.create",
      entityType: "Product",
      entityId: saved.id,
      metadata: {
        name: saved.name,
        sku: data.sku,
        status: data.status,
        blogPostId,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath(`/shop/${saved.slug}`);
    revalidatePath("/cart");
    revalidatePath("/");
    revalidatePath("/blogs");
    return { status: "success", message: "Product saved." };
  } catch (e) {
    console.error(e);
    return {
      status: "error",
      message: "Failed to save product. Slug or SKU might already exist.",
    };
  }
}

export async function deleteProduct(id: string) {
  const actor = await requireStaff("/admin/products");
  const product = await db.product.findUnique({
    where: { id },
    select: { name: true, slug: true, sku: true },
  });
  if (!product) {
    return { status: "error" as const, message: "Product not found." };
  }

  try {
    await db.product.delete({ where: { id } });
    await recordAuditLog({
      actorUserId: actor.id,
      action: "product.delete",
      entityType: "Product",
      entityId: id,
      metadata: { name: product.name, sku: product.sku },
    });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath(`/shop/${product.slug}`);
    revalidatePath("/");
    return { status: "success" as const };
  } catch {
    return {
      status: "error" as const,
      message: "Cannot delete product with orders.",
    };
  }
}

export async function toggleProductStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED",
) {
  await requireStaff("/admin/products");
  await db.product.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}
