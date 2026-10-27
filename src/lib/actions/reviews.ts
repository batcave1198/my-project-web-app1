"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff, requireUser } from "@/lib/auth/dal";
import { recordAuditLog } from "@/lib/admin/audit";
import { refreshProductRating } from "@/lib/reviews/rating";

const reviewSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  rating: z.coerce.number().int().min(1, "Choose a star rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters")
    .max(2000, "Review is too long"),
});

export type ReviewActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function parseImageUrls(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((url): url is string => typeof url === "string")
      .map((url) => url.trim())
      .filter(
        (url) =>
          url.startsWith("/uploads/reviews/") &&
          !url.includes("..") &&
          !url.includes("\\"),
      )
      .slice(0, 4);
  } catch {
    return [];
  }
}

export async function submitReview(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const user = await requireUser("/reviews");

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") || "",
    body: formData.get("body"),
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
  const product = await db.product.findFirst({
    where: { id: data.productId, status: "PUBLISHED" },
    select: { id: true, name: true, slug: true },
  });
  if (!product) {
    return {
      status: "error",
      message: "That product is not available for reviews.",
    };
  }

  const verifiedPurchase = await db.orderItem.findFirst({
    where: {
      productId: product.id,
      order: { userId: user.id, paymentStatus: "PAID" },
    },
    select: { id: true },
  });

  try {
    const review = await db.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        authorName: user.name,
        authorEmail: user.email,
        rating: data.rating,
        title: data.title || null,
        body: data.body,
        imageUrls: parseImageUrls(formData.get("imageUrls")),
        isVerifiedPurchase: Boolean(verifiedPurchase),
        status: "PENDING",
      },
      select: { id: true, productId: true },
    });

    await recordAuditLog({
      actorUserId: user.id,
      action: "review.submit",
      entityType: "Review",
      entityId: review.id,
      metadata: { product: product.name, rating: data.rating },
    });

    revalidatePath("/reviews");
    revalidatePath(`/shop/${product.slug}`);
    revalidatePath("/admin/reviews");
    return {
      status: "success",
      message:
        "Thank you. Your review has been submitted and will appear once approved.",
    };
  } catch (error) {
    console.error("[reviews] submit failed", error);
    return { status: "error", message: "Could not submit your review." };
  }
}

export type ReviewLikeResult =
  | { status: "success"; liked: boolean; count: number }
  | { status: "error"; message: string };

export async function toggleReviewLike(
  reviewId: string,
): Promise<ReviewLikeResult> {
  const user = await requireUser("/reviews");

  const review = await db.review.findFirst({
    where: { id: reviewId, status: "APPROVED" },
    select: { id: true, product: { select: { slug: true } } },
  });
  if (!review) return { status: "error", message: "Review not found." };

  try {
    const existing = await db.reviewLike.findUnique({
      where: { reviewId_userId: { reviewId, userId: user.id } },
      select: { id: true },
    });

    if (existing) {
      await db.reviewLike.delete({ where: { id: existing.id } });
    } else {
      await db.reviewLike.create({
        data: { reviewId, userId: user.id },
      });
    }

    const count = await db.reviewLike.count({ where: { reviewId } });
    revalidatePath("/reviews");
    revalidatePath(`/shop/${review.product.slug}`);
    return { status: "success", liked: !existing, count };
  } catch (error) {
    console.error("[reviews] like toggle failed", error);
    return { status: "error", message: "Could not update this like." };
  }
}

export async function setReviewStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  const actor = await requireStaff("/admin/reviews");
  const review = await db.review.findUnique({
    where: { id },
    select: {
      id: true,
      productId: true,
      authorName: true,
      product: { select: { slug: true, name: true } },
    },
  });
  if (!review) return { status: "error" as const, message: "Review not found." };

  await db.review.update({ where: { id }, data: { status } });
  await refreshProductRating(review.productId);
  await recordAuditLog({
    actorUserId: actor.id,
    action: `review.${status === "APPROVED" ? "approve" : "reject"}`,
    entityType: "Review",
    entityId: review.id,
    metadata: {
      author: review.authorName,
      product: review.product.name,
    },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath(`/shop/${review.product.slug}`);
  return { status: "success" as const };
}

export async function deleteReview(id: string) {
  const actor = await requireStaff("/admin/reviews");
  const review = await db.review.findUnique({
    where: { id },
    select: {
      id: true,
      productId: true,
      authorName: true,
      rating: true,
      product: { select: { slug: true, name: true } },
    },
  });
  if (!review) return { status: "error" as const, message: "Review not found." };

  try {
    await db.review.delete({ where: { id } });
    await refreshProductRating(review.productId);
    await recordAuditLog({
      actorUserId: actor.id,
      action: "review.delete",
      entityType: "Review",
      entityId: review.id,
      metadata: {
        author: review.authorName,
        rating: review.rating,
        product: review.product.name,
      },
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/reviews");
    revalidatePath(`/shop/${review.product.slug}`);
    return { status: "success" as const };
  } catch (error) {
    console.error("[reviews] delete failed", error);
    return { status: "error" as const, message: "Could not delete this review." };
  }
}

export type DeleteReviewResult =
  | { status: "success" }
  | { status: "error"; message: string };
