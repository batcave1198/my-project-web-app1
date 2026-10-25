import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Package, Trash2 } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatMoneyDecimal } from "@/lib/money";
import { formatWeight } from "@/lib/products/weight";
import { deleteProduct } from "@/lib/actions/product";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("/admin/products");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
    where.status = status as Prisma.EnumProductStatusFilter["equals"];
  }

  const products = await db.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      category: { select: { name: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-1 text-2xl font-semibold text-forest-900">Products</h1>
          <p className="mt-1 text-sm text-muted">
            Create and publish products for the storefront.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Add product
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-3">
          <form className="flex flex-1 flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or product ID..."
              className="h-9 rounded-md border border-line-strong px-3 text-sm"
            />
            <select name="status" defaultValue={status} className="h-9 rounded-md border border-line-strong px-2 text-sm">
              <option value="">All status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
          </form>
        </div>

        {products.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Package className="mx-auto size-8 text-gold-600" />
            <p className="mt-3 text-sm font-medium text-forest-900">No products yet</p>
            <p className="mt-1 text-xs text-muted">Add your first product to start building the catalogue.</p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/admin/products/new">Add product</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-2.5 font-semibold">Product</th>
                  <th className="px-4 py-2.5 font-semibold">Product ID</th>
                  <th className="px-4 py-2.5 font-semibold">Category</th>
                  <th className="px-4 py-2.5 font-semibold">Price</th>
                  <th className="px-4 py-2.5 font-semibold">Stock</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-6 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-line/70 last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0]?.url ? (
                          <img src={product.images[0].url} alt="" className="size-11 rounded-md object-cover" />
                        ) : (
                          <div className="size-11 rounded-md bg-cream-200" />
                        )}
                        <div>
                          <p className="font-medium text-forest-900">{product.name}</p>
                          <p className="text-xs text-muted">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{product.sku}</td>
                    <td className="px-4 py-3 text-ink-soft">{product.category.name}</td>
                    <td className="px-4 py-3 text-forest-900">
                      {formatMoneyDecimal(product.price.toString())}
                      {product.saleMode === "WEIGHT" && (
                        <span className="block text-xs text-muted">per 100g</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={product.stock <= product.lowStockAlert ? "text-danger" : "text-muted"}>
                        {product.saleMode === "WEIGHT"
                          ? formatWeight(product.stock)
                          : product.stock}
                      </span>
                      <span className="block text-xs text-muted">
                        {product.saleMode === "WEIGHT" ? "grams" : "units"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.status === "PUBLISHED"
                          ? "bg-success-soft text-success"
                          : product.status === "ARCHIVED"
                            ? "bg-danger-soft text-danger"
                            : "bg-cream-200 text-muted"
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/products/${product.id}/edit`} className="text-sm font-medium text-forest-900 hover:underline">
                          Edit
                        </Link>
                        <form action={async () => { "use server"; await deleteProduct(product.id); }}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
