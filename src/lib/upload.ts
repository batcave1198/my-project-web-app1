import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function saveLocalImage(file: File, folder = "products") {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Only JPG, PNG, WebP, AVIF or GIF images are allowed");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Image must be smaller than 5MB");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extensionByMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
  };
  const ext = extensionByMime[file.type] ?? ".jpg";

  const safeName = `${randomUUID()}${ext}`;
  const safeFolder =
    folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "products";
  const relativeDir = path.join("uploads", safeFolder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, safeName), buffer);

  return `/${relativeDir.replace(/\\/g, "/")}/${safeName}`;
}
