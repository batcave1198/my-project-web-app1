import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { requestMeta } from "@/lib/auth/session";
import { saveLocalImage, UploadError } from "@/lib/upload";

const MAX_MULTIPART_BYTES = 6 * 1024 * 1024;

/**
 * Customer review photos. The staff upload endpoint is deliberately separate so
 * customers can never choose an arbitrary destination folder.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to upload photos" },
        { status: 401 },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_MULTIPART_BYTES) {
      return NextResponse.json(
        { error: "Image must be smaller than 5MB." },
        { status: 413 },
      );
    }

    const meta = await requestMeta();
    const limits = await Promise.all([
      consumeRateLimit({
        key: `review-upload:user:${user.id}`,
        limit: 20,
        windowSeconds: 3600,
        blockSeconds: 3600,
      }),
      meta.ipAddress
        ? consumeRateLimit({
            key: `review-upload:ip:${meta.ipAddress}`,
            limit: 40,
            windowSeconds: 3600,
            blockSeconds: 3600,
          })
        : Promise.resolve({ allowed: true }),
    ]);
    if (limits.some((limit) => !limit.allowed)) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait before trying again." },
        { status: 429 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Send the image as multipart/form-data." },
        { status: 400 },
      );
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const url = await saveLocalImage(file, "reviews", {
      userId: user.id,
      dailyUploadLimit: 10,
      dailyByteLimit: 30 * 1024 * 1024,
    });
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[reviews/upload] failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
