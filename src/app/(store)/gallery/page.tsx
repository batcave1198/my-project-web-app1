import type { Metadata } from "next";
import Link from "next/link";
import { Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { getSiteCopy } from "@/lib/content";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos and videos from Ceylon Herbs and Spices — our herbs, spices, packing and the people behind them.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const [items, copy] = await Promise.all([
    db.galleryItem.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getSiteCopy(),
  ]);

  return (
    <div>
      <section className="border-b border-line bg-cream-100/60">
        <div className="container-page py-14 sm:py-18">
          <p className="eyebrow">
            <Camera className="size-3.5" aria-hidden="true" />
            {copy.gallery.hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] text-forest-950 sm:text-5xl">
            {copy.gallery.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            {copy.gallery.hero.body}
          </p>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-white px-6 py-20 text-center">
            <ImageIcon className="mx-auto size-9 text-gold-600" />
            <h2 className="mt-4 font-display text-2xl text-forest-900">
              {copy.gallery.empty.title}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              {copy.gallery.empty.body}
            </p>
            <Button asChild className="mt-6">
              <Link href="/shop">{copy.gallery.empty.action}</Link>
            </Button>
          </div>
        ) : (
          <GalleryGrid items={items} />
        )}
      </section>
    </div>
  );
}
