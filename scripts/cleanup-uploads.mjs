#!/usr/bin/env node
/**
 * Deletes local uploads that are older than 24 hours and no longer referenced
 * by any database row. Run daily from cron on the VPS:
 *
 *   npm run uploads:cleanup
 *
 * Images uploaded from a form but never attached to a product/blog/review are
 * removed by this job. Set UPLOAD_RETENTION_HOURS to change the grace period.
 */
import "dotenv/config";
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = process.cwd();
const uploadsDir = path.join(root, "public", "uploads");
const configuredRetention = Number(process.env.UPLOAD_RETENTION_HOURS ?? 24);
const retentionHours =
  Number.isFinite(configuredRetention) && configuredRetention >= 1
    ? configuredRetention
    : 24;
const cutoff = Date.now() - retentionHours * 60 * 60 * 1000;

function collectUploadUrlsFromText(text, set) {
  if (typeof text !== "string") return;
  const matches = text.match(/\/uploads\/[a-zA-Z0-9_./-]+/g) ?? [];
  for (const match of matches) set.add(match);
}

function collectFromJson(value, set) {
  if (typeof value === "string") {
    collectUploadUrlsFromText(value, set);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectFromJson(item, set);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectFromJson(item, set);
  }
}

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

async function main() {
  const referenced = new Set();

  const [
    productImages,
    productVideos,
    products,
    categories,
    brands,
    pages,
    blogPosts,
    reviews,
    gallery,
    orderItems,
    mediaAssets,
    siteSettings,
  ] = await Promise.all([
    prisma.productImage.findMany({ select: { url: true } }),
    prisma.productVideo.findMany({
      select: { url: true, thumbnailUrl: true },
    }),
    prisma.product.findMany({
      select: {
        ogImageUrl: true,
        description: true,
        shortDescription: true,
      },
    }),
    prisma.category.findMany({
      select: { imageUrl: true, description: true },
    }),
    prisma.brand.findMany({ select: { logoUrl: true } }),
    prisma.page.findMany({
      select: { heroImageUrl: true, content: true },
    }),
    prisma.blogPost.findMany({
      select: { imageUrls: true, content: true, excerpt: true },
    }),
    prisma.review.findMany({ select: { imageUrls: true } }),
    prisma.galleryItem.findMany({
      select: { imageUrl: true, thumbnailUrl: true },
    }),
    prisma.orderItem.findMany({ select: { imageUrl: true } }),
    prisma.mediaAsset.findMany({ select: { url: true, secureUrl: true } }),
    prisma.siteSetting.findMany({ select: { value: true } }),
  ]);

  for (const row of productImages) referenced.add(row.url);
  for (const row of productVideos) {
    if (row.url) referenced.add(row.url);
    if (row.thumbnailUrl) referenced.add(row.thumbnailUrl);
  }
  for (const row of products) {
    if (row.ogImageUrl) referenced.add(row.ogImageUrl);
    collectUploadUrlsFromText(row.description, referenced);
    collectUploadUrlsFromText(row.shortDescription, referenced);
  }
  for (const row of categories) {
    if (row.imageUrl) referenced.add(row.imageUrl);
    collectUploadUrlsFromText(row.description, referenced);
  }
  for (const row of brands) if (row.logoUrl) referenced.add(row.logoUrl);
  for (const row of pages) {
    if (row.heroImageUrl) referenced.add(row.heroImageUrl);
    collectUploadUrlsFromText(row.content, referenced);
  }
  for (const row of blogPosts) {
    for (const url of row.imageUrls) referenced.add(url);
    collectUploadUrlsFromText(row.content, referenced);
    collectUploadUrlsFromText(row.excerpt, referenced);
  }
  for (const row of reviews) {
    for (const url of row.imageUrls) referenced.add(url);
  }
  for (const row of gallery) {
    if (row.imageUrl) referenced.add(row.imageUrl);
    if (row.thumbnailUrl) referenced.add(row.thumbnailUrl);
  }
  for (const row of orderItems) if (row.imageUrl) referenced.add(row.imageUrl);
  for (const row of mediaAssets) {
    referenced.add(row.url);
    referenced.add(row.secureUrl);
  }
  for (const row of siteSettings) collectFromJson(row.value, referenced);

  const files = await walk(uploadsDir);
  let deleted = 0;
  let freedBytes = 0;

  for (const absolute of files) {
    if (path.basename(absolute).startsWith(".")) continue;
    const fileStat = await stat(absolute);
    if (fileStat.mtimeMs > cutoff) continue;

    const relative = path
      .relative(path.join(root, "public"), absolute)
      .split(path.sep)
      .join("/");
    const url = `/${relative}`;
    if (referenced.has(url)) continue;

    await unlink(absolute);
    deleted += 1;
    freedBytes += fileStat.size;
    await prisma.uploadAsset.deleteMany({ where: { url } }).catch(() => undefined);
  }

  const existingUrls = new Set(
    files.map((absolute) =>
      `/${path
        .relative(path.join(root, "public"), absolute)
        .split(path.sep)
        .join("/")}`,
    ),
  );
  const staleRows = await prisma.uploadAsset.findMany({ select: { id: true, url: true } });
  const staleIds = staleRows.filter((row) => !existingUrls.has(row.url)).map((row) => row.id);
  if (staleIds.length > 0) {
    await prisma.uploadAsset.deleteMany({ where: { id: { in: staleIds } } });
  }

  console.log(
    `[uploads:cleanup] deleted ${deleted} orphaned file(s), freed ${(freedBytes / 1024 / 1024).toFixed(2)} MB, removed ${staleIds.length} stale record(s).`,
  );
}

main()
  .catch((error) => {
    console.error("[uploads:cleanup] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
