"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { saveBlogPost, type BlogActionState } from "@/lib/actions/blogs";
import { slugify } from "@/lib/slug";

const initialState: BlogActionState = { status: "idle" };

type BlogFormProps = {
  item?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    imageUrls: string[];
    videoUrl: string | null;
    sortOrder: number;
    isPublished: boolean;
  };
};

export function BlogForm({ item }: BlogFormProps) {
  const router = useRouter();
  const [state, setState] = useState<BlogActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(Boolean(item?.slug));
  const [images, setImages] = useState<string[]>(item?.imageUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleTitle(value: string) {
    setTitle(value);
    if (!slugDirty) setSlug(slugify(value));
  }

  async function uploadPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    const remaining = 10 - images.length;
    if (remaining <= 0) {
      setUploadError("You can add up to 10 photos.");
      input.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      for (const file of files.slice(0, remaining)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "blogs");
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Upload failed");
        setImages((current) => [...current, json.url as string].slice(0, 10));
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("imageUrls", JSON.stringify(images));
    startTransition(async () => {
      const result = await saveBlogPost(state, formData);
      setState(result);
      if (result.status === "success") {
        router.push("/admin/blogs");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {item?.id && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="imageUrls" value={JSON.stringify(images)} />

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-base font-semibold text-forest-900">Article</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                name="title"
                value={title}
                onChange={(event) => handleTitle(event.target.value)}
                required
                maxLength={160}
                placeholder="Ceylon cinnamon tea recipe"
                className="mt-1.5"
              />
              <FieldError>{state.fieldErrors?.title}</FieldError>
            </div>
            <div>
              <Label htmlFor="blog-slug">URL slug</Label>
              <Input
                id="blog-slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugDirty(true);
                }}
                required
                maxLength={180}
                className="mt-1.5"
              />
              <FieldError>{state.fieldErrors?.slug}</FieldError>
            </div>
            <div>
              <Label htmlFor="blog-excerpt">Short description</Label>
              <Textarea
                id="blog-excerpt"
                name="excerpt"
                rows={3}
                maxLength={500}
                defaultValue={item?.excerpt ?? ""}
                placeholder="Shown on the blog cards and search results."
                className="mt-1.5"
              />
              <FieldError>{state.fieldErrors?.excerpt}</FieldError>
            </div>
            <div>
              <Label htmlFor="blog-content">Full description</Label>
              <Textarea
                id="blog-content"
                name="content"
                rows={14}
                required
                maxLength={20000}
                defaultValue={item?.content ?? ""}
                placeholder="Write the recipe, method, serving ideas or story..."
                className="mt-1.5"
              />
              <FieldError>{state.fieldErrors?.content}</FieldError>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">Photos</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              The first photo becomes the cover. Add up to 10 images.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {images.map((url, index) => (
                <div
                  key={url}
                  className="group relative aspect-square overflow-hidden rounded-md border border-line bg-cream-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-forest-950/80 px-1.5 py-0.5 text-[0.55rem] font-bold tracking-wide text-cream-50 uppercase">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setImages((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 rounded-full bg-forest-950/75 p-1 text-cream-50"
                  >
                    <X aria-hidden="true" className="size-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-line-strong text-[0.65rem] font-medium text-muted transition-colors hover:bg-cream-100/80">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    multiple
                    className="hidden"
                    onChange={uploadPhotos}
                  />
                  {uploading ? (
                    <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                  ) : images.length === 0 ? (
                    <ImagePlus aria-hidden="true" className="size-5" />
                  ) : (
                    <Upload aria-hidden="true" className="size-5" />
                  )}
                  {uploading ? "Uploading" : "Add photos"}
                </label>
              )}
            </div>
            {uploadError && <p className="mt-2 text-xs text-danger">{uploadError}</p>}
          </section>

          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">Video & publishing</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="blog-video">Video URL (optional)</Label>
                <Input
                  id="blog-video"
                  name="videoUrl"
                  type="url"
                  defaultValue={item?.videoUrl ?? ""}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-1.5"
                />
                <p className="mt-1.5 text-xs text-muted">
                  YouTube, Vimeo and direct MP4/WebM links are supported.
                </p>
                <FieldError>{state.fieldErrors?.videoUrl}</FieldError>
              </div>
              <div>
                <Label htmlFor="blog-sort">Sort order</Label>
                <Input
                  id="blog-sort"
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
              <p className="rounded-md bg-cream-100 px-3 py-2 text-xs leading-relaxed text-muted">
                Products can be linked to this recipe from the product edit
                page.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || uploading}>
          {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {item?.id ? "Save changes" : "Create blog post"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/blogs")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
