import "server-only";
import { NextResponse } from "next/server";
import { assertStaff } from "@/lib/auth/dal";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { requestMeta } from "@/lib/auth/session";
import {
  MAX_VIDEO_BYTES,
  saveLocalVideo,
  UploadError,
} from "@/lib/upload";

const MAX_MULTIPART_BYTES = MAX_VIDEO_BYTES + 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await assertStaff();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_MULTIPART_BYTES) {
      return NextResponse.json(
        { error: "Video must be smaller than 50MB." },
        { status: 413 },
      );
    }

    const meta = await requestMeta();
    const limits = await Promise.all([
      consumeRateLimit({
        key: `upload:video:user:${auth.user.id}`,
        limit: 30,
        windowSeconds: 3600,
        blockSeconds: 3600,
      }),
      meta.ipAddress
        ? consumeRateLimit({
            key: `upload:video:ip:${meta.ipAddress}`,
            limit: 60,
            windowSeconds: 3600,
            blockSeconds: 3600,
          })
        : Promise.resolve({ allowed: true }),
    ]);
    if (limits.some((limit) => !limit.allowed)) {
      return NextResponse.json(
        { error: "Too many video uploads. Please wait before trying again." },
        { status: 429 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Send the video as multipart/form-data." },
        { status: 400 },
      );
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No video uploaded" }, { status: 400 });
    }

    const result = await saveLocalVideo(file, "gallery", {
      userId: auth.user.id,
      dailyUploadLimit: 100,
      dailyByteLimit: 400 * 1024 * 1024,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[upload/video] failed", error);
    return NextResponse.json({ error: "Video upload failed" }, { status: 500 });
  }
}
