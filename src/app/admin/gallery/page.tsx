import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ImageIcon, Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { deleteGalleryItem } from "@/lib/actions/gallery";

export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  await requireStaff("/admin/gallery");

  const items = await db.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="mt-1 text-2xl font-semibold text-forest-900">Gallery</h1>
          <p className="mt-1 text-sm text-muted">
            Manage the standalone photo and video gallery. Gallery cards are not
            linked to products.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/gallery" target="_blank">
              <ExternalLink className="size-4" />
              View gallery
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/gallery/new">
              <Plus className="size-4" />
              Add media
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-white px-6 py-16 text-center">
          <ImageIcon className="mx-auto size-8 text-gold-600" />
          <p className="mt-3 text-sm font-medium text-forest-900">
            No gallery media yet
          </p>
          <p className="mt-1 text-xs text-muted">
            Add a photo or a YouTube/Vimeo video to start the gallery.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/admin/gallery/new">Add first item</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const preview =
              item.mediaType === "IMAGE" ? item.imageUrl : item.thumbnailUrl;
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-lg border border-line bg-white"
              >
                <div className="relative aspect-[4/3] bg-cream-200">
                  {preview ? (
                    <img
                      src={preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      {item.mediaType === "VIDEO" ? (
                        <Video className="size-8" />
                      ) : (
                        <ImageIcon className="size-8" />
                      )}
                    </div>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-forest-950/80 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-cream-50 uppercase">
                    {item.mediaType === "VIDEO" ? (
                      <Video className="size-3" />
                    ) : (
                      <ImageIcon className="size-3" />
                    )}
                    {item.mediaType}
                  </span>
                  {!item.isPublished && (
                    <span className="absolute right-3 top-3 rounded-full bg-gold-500 px-2 py-0.5 text-[0.65rem] font-bold text-forest-950">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="truncate text-sm font-semibold text-forest-900">
                    {item.title || "Untitled gallery item"}
                  </h2>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted">
                      Order {item.sortOrder}
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/gallery/${item.id}/edit`}
                        className="text-sm font-medium text-forest-900 hover:underline"
                      >
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteGalleryItem(item.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
