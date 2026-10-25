"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ImageIcon, Play, Video, X } from "lucide-react";
import { getVideoEmbedUrl, isDirectVideo } from "@/lib/gallery";
import { cn } from "@/lib/utils";

export type GalleryGridItem = {
  id: string;
  title: string | null;
  description: string | null;
  mediaType: "IMAGE" | "VIDEO";
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
};

export function GalleryGrid({ items }: { items: GalleryGridItem[] }) {
  const [selected, setSelected] = useState<GalleryGridItem | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const preview =
            item.mediaType === "IMAGE" ? item.imageUrl : item.thumbnailUrl;

          return (
            <article
              key={item.id}
              className="group overflow-hidden rounded-lg border border-line bg-white shadow-[0_1px_0_rgb(20_33_26/0.02)]"
            >
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-cream-200 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-800"
                aria-label={
                  item.title
                    ? `Open ${item.title}`
                    : `Open gallery ${item.mediaType.toLowerCase()}`
                }
              >
                {preview ? (
                  <Image
                    src={preview}
                    alt={item.title ?? ""}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-forest-700/50">
                    {item.mediaType === "VIDEO" ? (
                      <Video className="size-9" />
                    ) : (
                      <ImageIcon className="size-9" />
                    )}
                  </span>
                )}

                {item.mediaType === "VIDEO" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-forest-950/15 transition-colors group-hover:bg-forest-950/25">
                    <span className="flex size-14 items-center justify-center rounded-full bg-cream-50/95 text-forest-900 shadow-lg">
                      <Play className="ml-0.5 size-6 fill-current" />
                    </span>
                  </span>
                )}
              </button>

              {(item.title || item.description) && (
                <div className="p-5">
                  {item.title && (
                    <h2 className="text-base font-semibold text-forest-900">
                      {item.title}
                    </h2>
                  )}
                  {item.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Dialog.Root
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-forest-950/80 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-cream-50 shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
              <Dialog.Title className="truncate text-sm font-semibold text-forest-900">
                {selected?.title ||
                  (selected?.mediaType === "VIDEO" ? "Gallery video" : "Gallery photo")}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-forest-900/5 hover:text-forest-900"
                  aria-label="Close gallery viewer"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="bg-forest-950">
              {selected?.mediaType === "IMAGE" && selected.imageUrl ? (
                <div className="relative h-[65vh] min-h-72 w-full">
                  <Image
                    src={selected.imageUrl}
                    alt={selected.title ?? ""}
                    fill
                    sizes="90vw"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : selected?.mediaType === "VIDEO" && selected.videoUrl ? (
                <VideoViewer url={selected.videoUrl} title={selected.title} />
              ) : (
                <div className="flex h-72 items-center justify-center text-cream-200">
                  Media unavailable
                </div>
              )}
            </div>

            {selected?.description && (
              <Dialog.Description className="px-5 py-4 text-sm leading-relaxed text-ink-soft">
                {selected.description}
              </Dialog.Description>
            )}
            {!selected?.description && (
              <Dialog.Description className="sr-only">
                Gallery media viewer
              </Dialog.Description>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function VideoViewer({ url, title }: { url: string; title: string | null }) {
  const embedUrl = getVideoEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-2 px-4 text-center text-cream-200">
        <Video className="size-8" />
        <p className="text-sm">This video link could not be embedded.</p>
      </div>
    );
  }

  if (isDirectVideo(embedUrl)) {
    return (
      <video
        src={embedUrl}
        controls
        playsInline
        className={cn("mx-auto max-h-[70vh] w-full bg-black")}
        aria-label={title ?? "Gallery video"}
      />
    );
  }

  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={embedUrl}
        title={title ?? "Gallery video"}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
