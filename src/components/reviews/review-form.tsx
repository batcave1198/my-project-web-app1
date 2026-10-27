"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Star, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import {
  submitReview,
  type ReviewActionState,
} from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

const initialState: ReviewActionState = { status: "idle" };

type ReviewFormProps = {
  products: Array<{ id: string; name: string }>;
  initialProductId?: string;
  fixedProduct?: boolean;
  authenticated: boolean;
  loginHref?: string;
};

export function ReviewForm({
  products,
  initialProductId,
  fixedProduct = false,
  authenticated,
  loginHref = "/login?next=%2Freviews",
}: ReviewFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ReviewActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!authenticated) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-cream-100/50 px-6 py-8 text-center">
        <Star aria-hidden="true" className="mx-auto size-7 text-gold-500" />
        <h3 className="mt-3 text-base font-semibold text-forest-900">
          Share your experience
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          Sign in to rate a product, write a review and add your own photos.
        </p>
        <Button asChild className="mt-4">
          <Link href={loginHref}>Sign in to write a review</Link>
        </Button>
      </div>
    );
  }

  async function uploadPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    const remaining = 4 - images.length;
    if (remaining <= 0) {
      setUploadError("You can add up to 4 photos.");
      input.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      for (const file of files.slice(0, remaining)) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/reviews/upload", {
          method: "POST",
          body: formData,
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Upload failed");
        setImages((current) => [...current, json.url as string].slice(0, 4));
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
    formData.set("rating", String(rating));
    formData.set("imageUrls", JSON.stringify(images));

    startTransition(async () => {
      const result = await submitReview(state, formData);
      setState(result);
      if (result.status === "success") {
        formRef.current?.reset();
        setRating(5);
        setImages([]);
        router.refresh();
      }
    });
  }

  return (
    <form
      ref={formRef}
      id="write-review"
      onSubmit={handleSubmit}
      className="rounded-lg border border-line bg-white p-5 sm:p-6"
    >
      <h3 className="text-base font-semibold text-forest-900">Write a review</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Reviews are checked before appearing on the storefront. Add photos of
        the product you received if you would like.
      </p>

      {state.status === "success" && state.message && (
        <p
          role="status"
          className="mt-4 rounded-md border border-success/25 bg-success-soft px-4 py-3 text-sm text-success"
        >
          {state.message}
        </p>
      )}
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <div className="mt-5 space-y-4">
        {fixedProduct && initialProductId ? (
          <input type="hidden" name="productId" value={initialProductId} />
        ) : (
          <div>
            <Label htmlFor="review-product">Product</Label>
            <select
              id="review-product"
              name="productId"
              defaultValue={initialProductId ?? products[0]?.id ?? ""}
              required
              className="mt-1.5 block h-11 w-full rounded-md border border-line-strong bg-white px-3.5 text-sm"
            >
              <option value="">Choose a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <FieldError>{state.fieldErrors?.productId}</FieldError>
          </div>
        )}

        <fieldset>
          <legend className="text-sm font-medium text-ink-soft">
            Your rating
          </legend>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                aria-pressed={rating === star}
                className="rounded p-0.5 text-gold-500 transition-transform hover:scale-110"
              >
                <Star
                  aria-hidden="true"
                  className={cn(
                    "size-6",
                    star <= rating ? "fill-current" : "fill-transparent text-cream-400",
                  )}
                />
              </button>
            ))}
            <span className="ml-1.5 text-xs font-semibold text-earth-600">
              {rating}/5
            </span>
          </div>
          <FieldError>{state.fieldErrors?.rating}</FieldError>
        </fieldset>

        <div>
          <Label htmlFor="review-title">Title (optional)</Label>
          <Input
            id="review-title"
            name="title"
            maxLength={120}
            placeholder="A short summary"
            className="mt-1.5"
          />
          <FieldError>{state.fieldErrors?.title}</FieldError>
        </div>

        <div>
          <Label htmlFor="review-body">Your review</Label>
          <Textarea
            id="review-body"
            name="body"
            rows={5}
            minLength={10}
            maxLength={2000}
            required
            placeholder="What did you think of the product?"
            className="mt-1.5"
          />
          <FieldError>{state.fieldErrors?.body}</FieldError>
        </div>

        <div>
          <Label>Photos (optional, up to 4)</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((url, index) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-md border border-line bg-cream-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
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
            {images.length < 4 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-line-strong text-[0.65rem] font-medium text-muted transition-colors hover:bg-cream-100/70">
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
                {uploading ? "Uploading" : "Add photo"}
              </label>
            )}
          </div>
          {uploadError && (
            <p className="mt-1.5 text-xs text-danger">{uploadError}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={pending || uploading} className="mt-5">
        {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Submit review
      </Button>
    </form>
  );
}
