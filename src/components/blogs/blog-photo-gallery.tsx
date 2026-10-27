"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function BlogPhotoGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  if (images.length === 0) return null;

  function shift(direction: -1 | 1) {
    setSelected((current) => {
      if (current === null) return current;
      return (current + direction + images.length) % images.length;
    });
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-3",
          images.length === 1 ? "grid-cols-1" : "sm:grid-cols-2",
        )}
      >
        {images.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => setSelected(index)}
            className={cn(
              "group relative overflow-hidden rounded-lg border border-line bg-cream-200",
              images.length === 1 ? "aspect-[16/9]" : "aspect-[4/3]",
              images.length === 3 && index === 0 && "sm:col-span-2 sm:aspect-[21/9]",
            )}
            aria-label={`Open photo ${index + 1} of ${images.length}`}
          >
            <Image
              src={url}
              alt={`${title} photo ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-forest-950/75 px-2 py-1 text-[0.65rem] font-semibold text-cream-50 opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="size-3" />
              View
            </span>
          </button>
        ))}
      </div>

      <Dialog.Root
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-forest-950/90 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-0 z-50 flex flex-col p-4 focus:outline-none sm:p-8">
            <div className="flex items-center justify-between gap-4 text-cream-50">
              <Dialog.Title className="truncate text-sm font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Photo {selected === null ? 1 : selected + 1} of {images.length}
              </Dialog.Description>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 transition-colors hover:bg-cream-50/20"
                  aria-label="Close photo"
                >
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="relative mt-3 flex min-h-0 flex-1 items-center justify-center">
              {selected !== null && (
                <Image
                  src={images[selected]}
                  alt={`${title} photo ${selected + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => shift(-1)}
                    className="absolute left-0 z-10 flex size-10 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 transition-colors hover:bg-cream-50/20"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => shift(1)}
                    className="absolute right-0 z-10 flex size-10 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 transition-colors hover:bg-cream-50/20"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
