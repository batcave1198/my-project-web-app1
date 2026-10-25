import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New Product" };

export default async function NewProductPage() {
  await requireStaff("/admin/products");

  const [categories, brands] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">Add product</h1>
        <p className="mt-1 text-sm text-muted">Create a new product for the storefront.</p>
      </div>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
