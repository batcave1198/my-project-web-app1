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

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

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
      "Daily upload limit reached. Try again tomorrow.",
      429,
    );
  }
  if (usedBytes + file.size > byteLimit) {
    throw new UploadError(
      "Daily upload allowance reached. Try again tomorrow.",
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

const VIDEO_FOLDERS = new Set(["gallery"]);
const AUDIO_FOLDERS = new Set(["music"]);

type MediaKind = {
  extension: "mp4" | "webm" | "mp3" | "m4a" | "ogg" | "wav";
  mimeType: string;
};

async function readFileHeader(file: File, length = 64) {
  return Buffer.from(await file.slice(0, length).arrayBuffer());
}

function ascii(buffer: Buffer, start: number, end: number) {
  return buffer.toString("ascii", start, end);
}

function startsWith(buffer: Buffer, signature: number[]) {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

function hasWebmDocType(header: Buffer) {
  return (
    header.length >= 4 &&
    startsWith(header, [0x1a, 0x45, 0xdf, 0xa3]) &&
    header.includes("webm", 0, "ascii")
  );
}

function detectVideoKind(header: Buffer): MediaKind | null {
  if (header.length >= 12 && ascii(header, 4, 8) === "ftyp") {
    // QuickTime files often use the `qt  ` brand and are not reliably
    // playable in browsers, so they are rejected rather than mislabelled MP4.
    if (ascii(header, 8, 12) === "qt  ") return null;
    return { extension: "mp4", mimeType: "video/mp4" };
  }

  if (hasWebmDocType(header)) {
    return { extension: "webm", mimeType: "video/webm" };
  }

  return null;
}

function detectAudioKind(header: Buffer): MediaKind | null {
  if (header.length >= 3 && ascii(header, 0, 3) === "ID3") {
    return { extension: "mp3", mimeType: "audio/mpeg" };
  }
  if (header.length >= 4 && header[0] === 0xff && (header[1] & 0xe0) === 0xe0) {
    return { extension: "mp3", mimeType: "audio/mpeg" };
  }
  if (
    header.length >= 12 &&
    ascii(header, 0, 4) === "RIFF" &&
    ascii(header, 8, 12) === "WAVE"
  ) {
    return { extension: "wav", mimeType: "audio/wav" };
  }
  if (header.length >= 4 && ascii(header, 0, 4) === "OggS") {
    return { extension: "ogg", mimeType: "audio/ogg" };
  }
  if (hasWebmDocType(header)) {
    return { extension: "webm", mimeType: "audio/webm" };
  }
  if (header.length >= 12 && ascii(header, 4, 8) === "ftyp") {
    return { extension: "m4a", mimeType: "audio/mp4" };
  }

  return null;
}

async function saveLocalMediaFile({
  file,
  folder,
  kind,
  maxBytes,
  label,
  options,
}: {
  file: File;
  folder: string;
  kind: MediaKind;
  maxBytes: number;
  label: string;
  options: SaveOptions;
}) {
  if (file.size <= 0) {
    throw new UploadError("The selected file is empty.");
  }
  if (file.size > maxBytes) {
    throw new UploadError(
      `${label} must be smaller than ${Math.round(maxBytes / (1024 * 1024))}MB.`,
      413,
    );
  }

  const safeFolder = folder.trim().toLowerCase();
  const allowedFolders = kind.mimeType.startsWith("video/")
    ? VIDEO_FOLDERS
    : AUDIO_FOLDERS;
  if (!allowedFolders.has(safeFolder)) {
    throw new UploadError("That upload destination is not allowed.");
  }

  await assertWithinQuota(file, options);

  const data = Buffer.from(await file.arrayBuffer());
  const safeName = `${randomUUID()}.${kind.extension}`;
  const relativeDir = path.join("uploads", safeFolder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  const absolutePath = path.join(absoluteDir, safeName);
  const url = `/${relativeDir.replace(/\\/g, "/")}/${safeName}`;

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, data, { flag: "wx" });

  try {
    await db.uploadAsset.create({
      data: {
        userId: options.userId ?? null,
        url,
        folder: safeFolder,
        bytes: data.length,
        width: null,
        height: null,
      },
    });
  } catch (error) {
    await unlink(absolutePath).catch(() => undefined);
    throw error;
  }

  return { url, mimeType: kind.mimeType };
}

/**
 * Stores a short video for the gallery/home page. Videos are not transcoded,
 * so callers must only expose the file through a native <video> element.
 */
export async function saveLocalVideo(
  file: File,
  folder = "gallery",
  options: SaveOptions = {},
) {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new UploadError("Video must be smaller than 50MB.", 413);
  }

  const header = await readFileHeader(file);
  const kind = detectVideoKind(header);
  if (!kind) {
    throw new UploadError(
      "Only MP4 (H.264/AAC) or WebM video files are allowed.",
    );
  }

  return saveLocalMediaFile({
    file,
    folder,
    kind,
    maxBytes: MAX_VIDEO_BYTES,
    label: "Video",
    options,
  });
}

/** Stores background music for the storefront. MP3 is the most compatible. */
export async function saveLocalAudio(
  file: File,
  folder = "music",
  options: SaveOptions = {},
) {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new UploadError("Audio must be smaller than 20MB.", 413);
  }

  const header = await readFileHeader(file);
  const kind = detectAudioKind(header);
  if (!kind) {
    throw new UploadError(
      "Only MP3, M4A, OGG, WAV or WebM audio files are allowed.",
    );
  }

  return saveLocalMediaFile({
    file,
    folder,
    kind,
    maxBytes: MAX_AUDIO_BYTES,
    label: "Audio",
    options,
  });
}
