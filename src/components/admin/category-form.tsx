"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { slugify } from "@/lib/slug";
import { saveCategory, type CategoryActionState } from "@/lib/actions/category";

const initialState: CategoryActionState = { status: "idle" };

type CategoryFormProps = {
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    sortOrder: number;
    isActive: boolean;
  };
  parents: Array<{ id: string; name: string }>;
};

export function CategoryForm({ category, parents }: CategoryFormProps) {
  const router = useRouter();
  const [state, setState] = useState<CategoryActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(Boolean(category?.slug));
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugDirty) {
      setSlug(slugify(value));
    }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "categories");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setImageUrl(json.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveCategory(state, formData);
      setState(res);
      if (res.status === "success") {
        router.push("/admin/categories");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {category?.id && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.status === "success" && state.message && (
        <p role="status" className="rounded-md border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
          {state.message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-base font-semibold text-forest-900">General</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={name} onChange={(e) => handleNameChange(e.target.value)} required className="mt-1.5" />
              <FieldError>{state.fieldErrors?.name}</FieldError>
            </div>
            <div>
              <Label htmlFor="slug">URL slug</Label>
              <Input id="slug" name="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugDirty(true); }} required className="mt-1.5" />
              <FieldError>{state.fieldErrors?.slug}</FieldError>
            </div>
            <div>
              <Label htmlFor="parentId">Parent category</Label>
              <select id="parentId" name="parentId" defaultValue={category?.parentId ?? ""} className="mt-1.5 block w-full rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-sm">
                <option value="">None (top level)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === category?.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={category?.description ?? ""} rows={4} className="mt-1.5" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} />
              Active (visible in storefront)
            </label>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">Image</h2>
            <div className="mt-4 space-y-3">
              {imageUrl ? (
                <img src={imageUrl} alt={category?.imageAlt ?? ""} className="aspect-[4/3] w-full rounded-md object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-cream-200 text-sm text-muted">No image</div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-forest-900">
                <input type="file" accept="image/*" className="hidden" onChange={upload} />
                <Upload className="size-4" />
                {uploading ? "Uploading..." : "Upload image"}
              </label>
              <div>
                <Label htmlFor="imageAlt">Alt text</Label>
                <Input id="imageAlt" name="imageAlt" defaultValue={category?.imageAlt ?? ""} className="mt-1.5" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">SEO</h2>
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="seoTitle">SEO title</Label>
                <Input id="seoTitle" name="seoTitle" defaultValue={category?.seoTitle ?? ""} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO description</Label>
                <Textarea id="seoDescription" name="seoDescription" defaultValue={category?.seoDescription ?? ""} rows={3} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className="mt-1.5" />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSlug(slugify(name))} className="gap-1">
                <Sparkles className="size-3.5" />
                Regenerate slug from name
              </Button>
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {category?.id ? "Save changes" : "Create category"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/categories")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
