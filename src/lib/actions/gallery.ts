"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/dal";

const galleryItemSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().max(160).optional().or(z.literal("")),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    mediaType: z.enum(["IMAGE", "VIDEO"]),
    imageUrl: z.string().trim().optional().or(z.literal("")),
    videoUrl: z.string().trim().optional().or(z.literal("")),
    thumbnailUrl: z.string().trim().optional().or(z.literal("")),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isPublished: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const isLocalMedia = (value: string) =>
      /^\/(uploads|images)\//.test(value) && !value.includes("..");

    if (data.mediaType === "IMAGE" && !data.imageUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["imageUrl"],
        message: "Upload a gallery image.",
      });
    } else if (
      data.mediaType === "IMAGE" &&
      data.imageUrl &&
      !isLocalMedia(data.imageUrl)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["imageUrl"],
        message: "Upload the image using the gallery image field.",
      });
    }

    if (
      data.mediaType === "VIDEO" &&
      data.thumbnailUrl &&
      !isLocalMedia(data.thumbnailUrl)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["thumbnailUrl"],
        message: "Upload the thumbnail using the thumbnail field.",
      });
    }

    if (data.mediaType === "VIDEO") {
      if (!data.videoUrl) {
        ctx.addIssue({
          code: "custom",
          path: ["videoUrl"],
          message: "Add a YouTube, Vimeo or direct video URL.",
        });
      } else {
        try {
          const url = new URL(data.videoUrl);
          if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Invalid protocol");
          }
        } catch {
          ctx.addIssue({
            code: "custom",
            path: ["videoUrl"],
            message: "Enter a valid http(s) video URL.",
          });
        }
      }
    }
  });

export type GalleryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function emptyToNull(value?: string) {
  return value && value.trim() !== "" ? value.trim() : null;
}

export async function saveGalleryItem(
  _prev: GalleryActionState,
  formData: FormData,
): Promise<GalleryActionState> {
  await requireStaff("/admin/gallery");

  const parsed = galleryItemSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title") || "",
    description: formData.get("description") || "",
    mediaType: formData.get("mediaType"),
    imageUrl: formData.get("imageUrl") || "",
    videoUrl: formData.get("videoUrl") || "",
    thumbnailUrl: formData.get("thumbnailUrl") || "",
    sortOrder: formData.get("sortOrder") || 0,
    isPublished: formData.get("isPublished") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const payload = {
    title: emptyToNull(data.title),
    description: emptyToNull(data.description),
    mediaType: data.mediaType,
    imageUrl: data.mediaType === "IMAGE" ? emptyToNull(data.imageUrl) : null,
    videoUrl: data.mediaType === "VIDEO" ? emptyToNull(data.videoUrl) : null,
    thumbnailUrl:
      data.mediaType === "VIDEO" ? emptyToNull(data.thumbnailUrl) : null,
    sortOrder: data.sortOrder,
    isPublished: data.isPublished,
  };

  try {
    if (data.id) {
      await db.galleryItem.update({ where: { id: data.id }, data: payload });
    } else {
      await db.galleryItem.create({ data: payload });
    }

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { status: "success", message: "Gallery item saved." };
  } catch (error) {
    console.error("[gallery] save failed", error);
    return { status: "error", message: "Could not save the gallery item." };
  }
}

export async function deleteGalleryItem(id: string) {
  await requireStaff("/admin/gallery");
  try {
    await db.galleryItem.delete({ where: { id } });
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { status: "success" as const };
  } catch {
    return { status: "error" as const, message: "Could not delete this item." };
  }
}
