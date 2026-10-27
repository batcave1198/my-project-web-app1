"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/dal";
import { recordAuditLog } from "@/lib/admin/audit";

const musicTrackSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Add a title.").max(120, "Title is too long."),
  url: z.string().trim().min(1, "Upload an audio file or add a URL."),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(false),
});

export type MusicActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const LOCAL_AUDIO_PATTERN =
  /^\/uploads\/music\/[a-zA-Z0-9_-]+\.(mp3|m4a|ogg|wav|webm)$/i;

function isAllowedAudioUrl(value: string) {
  if (LOCAL_AUDIO_PATTERN.test(value)) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

async function removeLocalMusicFile(url: string) {
  if (!LOCAL_AUDIO_PATTERN.test(url)) return;
  const absolute = path.join(
    process.cwd(),
    "public",
    url.replace(/^\/+/, ""),
  );
  await unlink(absolute).catch(() => undefined);
  await db.uploadAsset.deleteMany({ where: { url } }).catch(() => undefined);
}

export async function saveMusicTrack(
  _prev: MusicActionState,
  formData: FormData,
): Promise<MusicActionState> {
  const actor = await requireStaff("/admin/music");

  const parsed = musicTrackSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title") || "",
    url: formData.get("url") || "",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
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
  if (!isAllowedAudioUrl(data.url)) {
    return {
      status: "error",
      message: "Enter a valid audio URL or upload a supported audio file.",
      fieldErrors: { url: "Use an uploaded file or a valid http(s) URL." },
    };
  }

  try {
    const saved = await db.$transaction(async (tx) => {
      if (data.isActive) {
        await tx.musicTrack.updateMany({
          where: {
            isActive: true,
            ...(data.id ? { id: { not: data.id } } : {}),
          },
          data: { isActive: false },
        });
      }

      return data.id
        ? tx.musicTrack.update({
            where: { id: data.id },
            data: {
              title: data.title,
              url: data.url,
              sortOrder: data.sortOrder,
              isActive: data.isActive,
            },
          })
        : tx.musicTrack.create({
            data: {
              title: data.title,
              url: data.url,
              sortOrder: data.sortOrder,
              isActive: data.isActive,
            },
          });
    });

    await recordAuditLog({
      actorUserId: actor.id,
      action: data.id ? "music.update" : "music.create",
      entityType: "MusicTrack",
      entityId: saved.id,
      metadata: {
        title: saved.title,
        url: saved.url,
        isActive: saved.isActive,
      },
    });

    revalidatePath("/admin/music");
    revalidatePath("/", "layout");
    return { status: "success", message: "Music track saved." };
  } catch (error) {
    console.error("[music] save failed", error);
    return { status: "error", message: "Could not save the music track." };
  }
}

export async function setMusicTrackActive(id: string, isActive: boolean) {
  const actor = await requireStaff("/admin/music");
  const track = await db.musicTrack.findUnique({
    where: { id },
    select: { title: true, url: true },
  });
  if (!track) {
    return { status: "error" as const, message: "Track not found." };
  }

  try {
    await db.$transaction(async (tx) => {
      if (isActive) {
        await tx.musicTrack.updateMany({
          where: { isActive: true, id: { not: id } },
          data: { isActive: false },
        });
      }
      await tx.musicTrack.update({
        where: { id },
        data: { isActive },
      });
    });

    await recordAuditLog({
      actorUserId: actor.id,
      action: "music.activate",
      entityType: "MusicTrack",
      entityId: id,
      metadata: { title: track.title, isActive },
    });

    revalidatePath("/admin/music");
    revalidatePath("/", "layout");
    return { status: "success" as const };
  } catch (error) {
    console.error("[music] activate failed", error);
    return {
      status: "error" as const,
      message: "Could not update the music track.",
    };
  }
}

export async function deleteMusicTrack(id: string) {
  const actor = await requireStaff("/admin/music");
  const track = await db.musicTrack.findUnique({
    where: { id },
    select: { title: true, url: true },
  });
  if (!track) {
    return { status: "error" as const, message: "Track not found." };
  }

  try {
    await db.musicTrack.delete({ where: { id } });
    await removeLocalMusicFile(track.url);

    await recordAuditLog({
      actorUserId: actor.id,
      action: "music.delete",
      entityType: "MusicTrack",
      entityId: id,
      metadata: { title: track.title, url: track.url },
    });

    revalidatePath("/admin/music");
    revalidatePath("/", "layout");
    return { status: "success" as const };
  } catch (error) {
    console.error("[music] delete failed", error);
    return { status: "error" as const, message: "Could not delete the track." };
  }
}
