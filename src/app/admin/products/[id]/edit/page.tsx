import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("/admin/products");
  const { id } = await params;

  const [product, categories, brands, blogPosts] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, videos: true, specs: true, variants: true } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.blogPost.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true, title: true, isPublished: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">Edit product</h1>
        <p className="mt-1 text-sm text-muted">{product.name}</p>
      </div>
      <ProductForm
        product={{
          ...product,
          price: product.price.toString(),
          compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toString() : null,
          images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
        }}
        categories={categories}
        brands={brands}
        blogPosts={blogPosts}
      />
    </div>
  );
}
