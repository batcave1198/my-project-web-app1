import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Metadata, OutputInfo } from "sharp";
import { db } from "@/lib/db";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif"]);
export const ALLOWED_UPLOAD_FOLDERS = new Set([
  "products",
  "blogs",
  "gallery",
  "categories",
  "reviews",
]);
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_DIMENSION = 8_000;
const MAX_OUTPUT_DIMENSION = 2_400;
const MAX_ANIMATED_FRAMES = 120;

const DEFAULT_DAILY_UPLOAD_LIMIT = 30;
const DEFAULT_DAILY_BYTE_LIMIT = 80 * 1024 * 1024;

export class UploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}

type SaveOptions = {
  userId?: string | null;
  dailyUploadLimit?: number;
  dailyByteLimit?: number;
};

function startOfUtcDay() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

async function assertWithinQuota(file: File, options: SaveOptions) {
  if (!options.userId) return;

  const uploads = await db.uploadAsset.aggregate({
    where: {
      userId: options.userId,
      createdAt: { gte: startOfUtcDay() },
    },
    _count: { _all: true },
    _sum: { bytes: true },
  });

  const dailyLimit = options.dailyUploadLimit ?? DEFAULT_DAILY_UPLOAD_LIMIT;
  const byteLimit = options.dailyByteLimit ?? DEFAULT_DAILY_BYTE_LIMIT;
  const usedBytes = uploads._sum.bytes ?? 0;

  if (uploads._count._all >= dailyLimit) {
    throw new UploadError(
      "Daily image upload limit reached. Try again tomorrow.",
      429,
    );
  }
  if (usedBytes + file.size > byteLimit) {
    throw new UploadError(
      "Daily image upload allowance reached. Try again tomorrow.",
      429,
    );
  }
}

/**
 * Validates by decoding the actual bytes (not the browser-supplied MIME type),
 * strips metadata, resizes oversized images and re-encodes every upload to WebP.
 * This blocks polyglot files, SVG/HTML payloads and decompression bombs.
 */
export async function saveLocalImage(
  file: File,
  folder = "products",
  options: SaveOptions = {},
) {
  if (file.size <= 0) {
    throw new UploadError("The selected file is empty.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new UploadError("Image must be smaller than 5MB.", 413);
  }

  await assertWithinQuota(file, options);

  const input = Buffer.from(await file.arrayBuffer());

  let metadata: Metadata;
  try {
    metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();
  } catch {
    throw new UploadError("That file is not a readable image.");
  }

  const format = metadata.format;
  if (!format || !ALLOWED_FORMATS.has(format)) {
    throw new UploadError("Only JPG, PNG, WebP, AVIF or GIF images are allowed.");
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const frames = metadata.pages ?? 1;
  if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new UploadError("Image dimensions are too large. Maximum is 8000px.");
  }
  if (frames > MAX_ANIMATED_FRAMES) {
    throw new UploadError("Animated images can have at most 120 frames.");
  }
  if (width * height * frames > MAX_INPUT_PIXELS) {
    throw new UploadError("Image has too many pixels to process safely.");
  }

  let processed: Buffer;
  let outputInfo: OutputInfo;
  try {
    const pipeline = sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      animated: frames > 1,
    })
      .rotate()
      .resize({
        width: MAX_OUTPUT_DIMENSION,
        height: MAX_OUTPUT_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4, loop: 0 });

    const result = await pipeline.toBuffer({ resolveWithObject: true });
    processed = result.data;
    outputInfo = result.info;
  } catch {
    throw new UploadError("The image could not be processed.");
  }

  if (processed.length > MAX_OUTPUT_BYTES) {
    throw new UploadError(
      "The processed image is still larger than 5MB. Please choose a smaller image.",
      413,
    );
  }

  const safeFolder = folder.trim().toLowerCase();
  if (!ALLOWED_UPLOAD_FOLDERS.has(safeFolder)) {
    throw new UploadError("That upload destination is not allowed.");
  }
  const safeName = `${randomUUID()}.webp`;
  const relativeDir = path.join("uploads", safeFolder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  const absolutePath = path.join(absoluteDir, safeName);
  const url = `/${relativeDir.replace(/\\/g, "/")}/${safeName}`;

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, processed, { flag: "wx" });

  try {
    await db.uploadAsset.create({
      data: {
        userId: options.userId ?? null,
        url,
        folder: safeFolder,
        bytes: processed.length,
        width: outputInfo.width,
        height: outputInfo.height,
      },
    });
  } catch (error) {
    await unlink(absolutePath).catch(() => undefined);
    throw error;
  }

  return url;
}
