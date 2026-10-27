"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/dal";
import { recordAuditLog } from "@/lib/admin/audit";
import { isDirectVideo } from "@/lib/gallery";

const galleryItemSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().max(160).optional().or(z.literal("")),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    mediaType: z.enum(["IMAGE", "VIDEO"]),
    imageUrl: z.string().trim().optional().or(z.literal("")),
    videoUrl: z.string().trim().optional().or(z.literal("")),
    thumbnailUrl: z.string().trim().optional().or(z.literal("")),
    showOnHome: z.coerce.boolean().default(false),
    homeCaption: z.string().trim().max(400).optional().or(z.literal("")),
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
          message: "Upload a video or add a YouTube, Vimeo or MP4/WebM URL.",
        });
      } else if (!isLocalMedia(data.videoUrl)) {
        try {
          const url = new URL(data.videoUrl);
          if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Invalid protocol");
          }
        } catch {
          ctx.addIssue({
            code: "custom",
            path: ["videoUrl"],
            message: "Enter a valid http(s) video URL or upload a video file.",
          });
        }
      }

      if (data.showOnHome && data.videoUrl && !isDirectVideo(data.videoUrl)) {
        ctx.addIssue({
          code: "custom",
          path: ["showOnHome"],
          message:
            "Only uploaded MP4/WebM videos or direct video URLs can be featured on the home page.",
        });
      }
    }

    if (data.mediaType === "IMAGE" && data.showOnHome) {
      ctx.addIssue({
        code: "custom",
        path: ["showOnHome"],
        message: "Only videos can be featured on the home page.",
      });
    }

    if (data.showOnHome && !data.isPublished) {
      ctx.addIssue({
        code: "custom",
        path: ["showOnHome"],
        message: "Publish the video before featuring it on the home page.",
      });
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
  const actor = await requireStaff("/admin/gallery");

  const parsed = galleryItemSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title") || "",
    description: formData.get("description") || "",
    mediaType: formData.get("mediaType"),
    imageUrl: formData.get("imageUrl") || "",
    videoUrl: formData.get("videoUrl") || "",
    thumbnailUrl: formData.get("thumbnailUrl") || "",
    showOnHome: formData.get("showOnHome") === "on",
    homeCaption: formData.get("homeCaption") || "",
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
    showOnHome: data.mediaType === "VIDEO" ? data.showOnHome : false,
    homeCaption:
      data.mediaType === "VIDEO" ? emptyToNull(data.homeCaption) : null,
    sortOrder: data.sortOrder,
    isPublished: data.isPublished,
  };

  try {
    const saved = await db.$transaction(async (tx) => {
      if (payload.showOnHome) {
        await tx.galleryItem.updateMany({
          where: {
            showOnHome: true,
            ...(data.id ? { id: { not: data.id } } : {}),
          },
          data: { showOnHome: false },
        });
      }

      return data.id
        ? tx.galleryItem.update({
            where: { id: data.id },
            data: payload,
            select: {
              id: true,
              title: true,
              mediaType: true,
              showOnHome: true,
            },
          })
        : tx.galleryItem.create({
            data: payload,
            select: {
              id: true,
              title: true,
              mediaType: true,
              showOnHome: true,
            },
          });
    });

    await recordAuditLog({
      actorUserId: actor.id,
      action: data.id ? "gallery.update" : "gallery.create",
      entityType: "GalleryItem",
      entityId: saved.id,
      metadata: {
        title: saved.title,
        mediaType: saved.mediaType,
        published: payload.isPublished,
        showOnHome: saved.showOnHome,
      },
    });

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    revalidatePath("/");
    return { status: "success", message: "Gallery item saved." };
  } catch (error) {
    console.error("[gallery] save failed", error);
    return { status: "error", message: "Could not save the gallery item." };
  }
}

export async function deleteGalleryItem(id: string) {
  const actor = await requireStaff("/admin/gallery");
  const item = await db.galleryItem.findUnique({
    where: { id },
    select: { title: true, mediaType: true, showOnHome: true },
  });
  try {
    await db.galleryItem.delete({ where: { id } });
    await recordAuditLog({
      actorUserId: actor.id,
      action: "gallery.delete",
      entityType: "GalleryItem",
      entityId: id,
      metadata: {
        title: item?.title ?? null,
        mediaType: item?.mediaType ?? null,
        showOnHome: item?.showOnHome ?? false,
      },
    });
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    revalidatePath("/");
    return { status: "success" as const };
  } catch {
    return { status: "error" as const, message: "Could not delete this item." };
  }
}

export async function setGalleryHomeVideo(id: string, showOnHome: boolean) {
  const actor = await requireStaff("/admin/gallery");
  const item = await db.galleryItem.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      mediaType: true,
      videoUrl: true,
      isPublished: true,
    },
  });

  if (!item || item.mediaType !== "VIDEO" || !item.videoUrl) {
    return {
      status: "error" as const,
      message: "Only gallery videos can be featured on the home page.",
    };
  }
  if (showOnHome && !item.isPublished) {
    return {
      status: "error" as const,
      message: "Publish the video before featuring it on the home page.",
    };
  }
  if (showOnHome && !isDirectVideo(item.videoUrl)) {
    return {
      status: "error" as const,
      message:
        "Only uploaded MP4/WebM videos or direct video URLs can be featured on the home page.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      if (showOnHome) {
        await tx.galleryItem.updateMany({
          where: { showOnHome: true, id: { not: id } },
          data: { showOnHome: false },
        });
      }
      await tx.galleryItem.update({
        where: { id },
        data: { showOnHome },
      });
    });

    await recordAuditLog({
      actorUserId: actor.id,
      action: "gallery.home_video",
      entityType: "GalleryItem",
      entityId: id,
      metadata: {
        title: item.title,
        showOnHome,
        published: item.isPublished,
      },
    });

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    revalidatePath("/");
    return { status: "success" as const };
  } catch (error) {
    console.error("[gallery] home video update failed", error);
    return {
      status: "error" as const,
      message: "Could not update the home page video.",
    };
  }
}
