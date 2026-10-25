"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import {
  saveGalleryItem,
  type GalleryActionState,
} from "@/lib/actions/gallery";
import { cn } from "@/lib/utils";

const initialState: GalleryActionState = { status: "idle" };

type GalleryFormProps = {
  item?: {
    id: string;
    title: string | null;
    description: string | null;
    mediaType: "IMAGE" | "VIDEO";
    imageUrl: string | null;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    sortOrder: number;
    isPublished: boolean;
  };
};

export function GalleryForm({ item }: GalleryFormProps) {
  const router = useRouter();
  const [state, setState] = useState<GalleryActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">(
    item?.mediaType ?? "IMAGE",
  );
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(item?.thumbnailUrl ?? "");
  const [uploading, setUploading] = useState<"image" | "thumbnail" | null>(null);

  async function upload(
    file: File | undefined,
    target: "image" | "thumbnail",
  ) {
    if (!file) return;
    setUploading(target);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gallery");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Upload failed");
      if (target === "image") setImageUrl(json.url);
      else setThumbnailUrl(json.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveGalleryItem(state, formData);
      setState(result);
      if (result.status === "success") {
        router.push("/admin/gallery");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {item?.id && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-base font-semibold text-forest-900">Media</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="mediaType">Media type</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(
                  [
                    ["IMAGE", "Photo", ImageIcon],
                    ["VIDEO", "Video", Video],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMediaType(value)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                      mediaType === value
                        ? "border-forest-800 bg-forest-900 text-cream-50"
                        : "border-line-strong text-forest-900 hover:border-forest-600",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
              <input type="hidden" name="mediaType" value={mediaType} />
            </div>

            {mediaType === "IMAGE" ? (
              <div>
                <Label>Gallery image</Label>
                <div className="mt-1.5 overflow-hidden rounded-md border border-line bg-cream-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted">
                      No image selected
                    </div>
                  )}
                </div>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-forest-900 hover:underline">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      void upload(event.target.files?.[0], "image");
                      event.currentTarget.value = "";
                    }}
                  />
                  {uploading === "image" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploading === "image" ? "Uploading..." : "Upload image"}
                </label>
                <FieldError>{state.fieldErrors?.imageUrl}</FieldError>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    name="videoUrl"
                    type="url"
                    defaultValue={item?.videoUrl ?? ""}
                    placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                    className="mt-1.5"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    YouTube, Vimeo and direct MP4/WebM video links are supported.
                  </p>
                  <FieldError>{state.fieldErrors?.videoUrl}</FieldError>
                </div>

                <div>
                  <Label>Video thumbnail</Label>
                  <div className="mt-1.5 overflow-hidden rounded-md border border-line bg-cream-100">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center text-sm text-muted">
                        Optional thumbnail shown on the gallery card
                      </div>
                    )}
                  </div>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-forest-900 hover:underline">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      className="hidden"
                      onChange={(event) => {
                        void upload(event.target.files?.[0], "thumbnail");
                        event.currentTarget.value = "";
                      }}
                    />
                    {uploading === "thumbnail" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {uploading === "thumbnail"
                      ? "Uploading..."
                      : "Upload thumbnail"}
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-base font-semibold text-forest-900">Details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                name="title"
                defaultValue={item?.title ?? ""}
                maxLength={160}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={item?.description ?? ""}
                maxLength={2000}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={item?.sortOrder ?? 0}
                className="mt-1.5"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked={item?.isPublished ?? true}
                className="size-4 accent-forest-800"
              />
              Published on the storefront
            </label>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {item?.id ? "Save changes" : "Add to gallery"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/gallery")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
