"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { slugify } from "@/lib/slug";
import { saveProduct, type ProductActionState } from "@/lib/actions/product";

const initialState: ProductActionState = { status: "idle" };

type ProductFormProps = {
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    categoryId: string;
    brandId: string | null;
    blogPostId: string | null;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    saleMode: "UNIT" | "WEIGHT";
    shortDescription: string | null;
    description: string | null;
    price: number | string;
    compareAtPrice: number | string | null;
    stock: number;
    lowStockAlert: number;
    ingredients: string | null;
    origin: string | null;
    packagingDetails: string | null;
    storageInstructions: string | null;
    usageInstructions: string | null;
    allergenInfo: string | null;
    tags: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    ogImageUrl: string | null;
    isFeatured: boolean;
    images?: Array<{ url: string; alt: string | null }>;
  };
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  blogPosts: Array<{ id: string; title: string; isPublished: boolean }>;
};

export function ProductForm({
  product,
  categories,
  brands,
  blogPosts,
}: ProductFormProps) {
  const router = useRouter();
  const [state, setState] = useState<ProductActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(Boolean(product?.slug));
  const [images, setImages] = useState<Array<{ url: string; alt: string }>>(
    product?.images?.map((i) => ({ url: i.url, alt: i.alt ?? "" })) ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [saleMode, setSaleMode] = useState<"UNIT" | "WEIGHT">(
    product?.saleMode ?? "UNIT",
  );

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
      fd.append("folder", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setImages((prev) => [...prev, { url: json.url, alt: name || "" }]);
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
    images.forEach((img, idx) => {
      formData.append(`images[${idx}].url`, img.url);
      formData.append(`images[${idx}].alt`, img.alt);
    });
    startTransition(async () => {
      const res = await saveProduct(state, formData);
      setState(res);
      if (res.status === "success") {
        router.push("/admin/products");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

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

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">General</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="name">Product name</Label>
                <Input id="name" name="name" value={name} onChange={(e) => handleNameChange(e.target.value)} required className="mt-1.5" />
                <FieldError>{state.fieldErrors?.name}</FieldError>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="slug">URL slug</Label>
                  <Input id="slug" name="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugDirty(true); }} required className="mt-1.5" />
                  <FieldError>{state.fieldErrors?.slug}</FieldError>
                </div>
                <div>
                  <Label htmlFor="sku">Product ID (SKU)</Label>
                  <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} required className="mt-1.5" />
                  <FieldError>{state.fieldErrors?.sku}</FieldError>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} required className="mt-1.5 block w-full rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-sm">
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <FieldError>{state.fieldErrors?.categoryId}</FieldError>
                </div>
                <div>
                  <Label htmlFor="brandId">Brand (optional)</Label>
                  <select id="brandId" name="brandId" defaultValue={product?.brandId ?? ""} className="mt-1.5 block w-full rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-sm">
                    <option value="">None</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="shortDescription">Short description</Label>
                <Textarea id="shortDescription" name="shortDescription" defaultValue={product?.shortDescription ?? ""} rows={2} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="description">Full description</Label>
                <Textarea id="description" name="description" defaultValue={product?.description ?? ""} rows={6} className="mt-1.5" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} />
                Featured product
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">Images</h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {images.map((img, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-md border border-line">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute right-1 top-1 rounded-full bg-forest-950/70 p-1 text-cream-50">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line-strong aspect-square text-sm text-muted hover:bg-cream-100/60">
                  <input type="file" accept="image/*" className="hidden" onChange={upload} />
                  <Upload className="size-5" />
                  {uploading ? "Uploading..." : "Add image"}
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">Product details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea id="ingredients" name="ingredients" defaultValue={product?.ingredients ?? ""} rows={3} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input id="origin" name="origin" defaultValue={product?.origin ?? ""} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="packagingDetails">Packaging</Label>
                <Input id="packagingDetails" name="packagingDetails" defaultValue={product?.packagingDetails ?? ""} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="storageInstructions">Storage</Label>
                <Input id="storageInstructions" name="storageInstructions" defaultValue={product?.storageInstructions ?? ""} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="usageInstructions">Usage</Label>
                <Input id="usageInstructions" name="usageInstructions" defaultValue={product?.usageInstructions ?? ""} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="allergenInfo">Allergen info</Label>
                <Input id="allergenInfo" name="allergenInfo" defaultValue={product?.allergenInfo ?? ""} className="mt-1.5" />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" defaultValue={product?.tags?.join(", ") ?? ""} placeholder="cinnamon, whole, spice" className="mt-1.5" />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">Publish</h2>
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue={product?.status ?? "DRAFT"} className="mt-1.5 block w-full rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-sm">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <p className="text-xs text-muted">Published products appear in the shop.</p>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-gold-600" />
              <h2 className="text-base font-semibold text-forest-900">
                Recipe / blog
              </h2>
            </div>
            <div className="mt-4">
              <Label htmlFor="blogPostId">Linked post (optional)</Label>
              <select
                id="blogPostId"
                name="blogPostId"
                defaultValue={product?.blogPostId ?? ""}
                className="mt-1.5 block w-full rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-sm"
              >
                <option value="">No linked recipe</option>
                {blogPosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                    {post.isPublished ? "" : " (draft)"}
                  </option>
                ))}
              </select>
              <FieldError>{state.fieldErrors?.blogPostId}</FieldError>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Optional. The product page will show a recipe callout and the
                published post will list this product.
              </p>
              {blogPosts.length === 0 && (
                <Link
                  href="/admin/blogs/new"
                  className="mt-2 inline-block text-xs font-semibold text-earth-700 hover:underline"
                >
                  Create a recipe or blog post
                </Link>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">Pricing & Stock</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="saleMode">Selling mode</Label>
                <select
                  id="saleMode"
                  name="saleMode"
                  value={saleMode}
                  onChange={(event) =>
                    setSaleMode(event.target.value as "UNIT" | "WEIGHT")
                  }
                  className="mt-1.5 block w-full rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-sm"
                >
                  <option value="UNIT">Unit / packet</option>
                  <option value="WEIGHT">Weight (price per 100g)</option>
                </select>
                <p className="mt-1.5 text-xs text-muted">
                  {saleMode === "WEIGHT"
                    ? "Customers choose grams or kilograms. The price is calculated from the price per 100g."
                    : "Customers buy whole units. Stock is counted in units."}
                </p>
              </div>
              <div>
                <Label htmlFor="price">
                  {saleMode === "WEIGHT"
                    ? "Price per 100g (USD)"
                    : "Price (USD)"}
                </Label>
                <Input id="price" name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? ""} required className="mt-1.5" />
                <FieldError>{state.fieldErrors?.price}</FieldError>
              </div>
              <div>
                <Label htmlFor="compareAtPrice">
                  {saleMode === "WEIGHT"
                    ? "Compare at price per 100g (optional)"
                    : "Compare at price (optional)"}
                </Label>
                <Input id="compareAtPrice" name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={product?.compareAtPrice ?? ""} className="mt-1.5" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="stock">
                    {saleMode === "WEIGHT" ? "Stock (grams)" : "Stock (units)"}
                  </Label>
                  <Input id="stock" name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="lowStockAlert">
                    {saleMode === "WEIGHT"
                      ? "Low stock alert (grams)"
                      : "Low stock alert (units)"}
                  </Label>
                  <Input id="lowStockAlert" name="lowStockAlert" type="number" min="0" step="1" defaultValue={product?.lowStockAlert ?? 5} className="mt-1.5" />
                </div>
              </div>
              {saleMode === "WEIGHT" && (
                <div className="rounded-md border border-gold-500/30 bg-gold-500/10 px-3 py-2.5 text-xs leading-relaxed text-earth-700">
                  Customers see 100g, 250g, 500g and 1kg presets, plus a custom
                  amount. Minimum 50g, in 10g steps.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-forest-900">SEO</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="seoTitle">SEO title</Label>
                <Input id="seoTitle" name="seoTitle" defaultValue={product?.seoTitle ?? ""} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO description</Label>
                <Textarea id="seoDescription" name="seoDescription" defaultValue={product?.seoDescription ?? ""} rows={3} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="ogImageUrl">OG image URL</Label>
                <Input id="ogImageUrl" name="ogImageUrl" defaultValue={product?.ogImageUrl ?? ""} className="mt-1.5" />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSlug(slugify(name))} className="gap-1">
                <Sparkles className="size-3.5" />
                Regenerate slug
              </Button>
            </div>
          </section>

          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {product?.id ? "Save product" : "Create product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
