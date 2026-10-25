import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { ProductImportForm } from "@/components/admin/product-import-form";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Bulk Product Import" };

export default async function ProductImportPage() {
  await requireStaff("/admin/products/import");

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-forest-900"
        >
          <ArrowLeft className="size-4" />
          Products
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-forest-900">
          Bulk product import
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          Import products from CSV or Excel using USD prices. Each row is
          identified by its{" "}
          <strong className="font-semibold text-ink-soft">Product ID</strong>{" "}
          (stored as the SKU), so you can create new products or update existing
          ones without duplicating them.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-gold-500/35 bg-gold-500/10 px-4 py-3 text-sm leading-relaxed text-earth-700">
        <Info className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-semibold">Import tips</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
            <li>
              Prices and compare-at prices must be entered in{" "}
              <strong className="font-semibold">USD</strong>. For weight
              products, the price is <strong className="font-semibold">per 100g</strong>.
            </li>
            <li>
              For updates, only columns present in the file are changed. Stock,
              images and other optional fields stay as they are when the column
              is omitted.
            </li>
            <li>
              Weight products use <code className="font-mono">sale_mode</code>{" "}
              <code className="font-mono">WEIGHT</code> and track{" "}
              <code className="font-mono">stock</code> in grams.
            </li>
            <li>
              Product IDs must be unique within the file. Duplicate IDs reject
              the whole upload before any rows are saved.
            </li>
            <li>
              Product IDs and slugs must be unique. A missing slug is generated
              from the product name.
            </li>
            <li>
              Images must be local paths already uploaded to{" "}
              <code className="font-mono">/uploads/...</code> or{" "}
              <code className="font-mono">/images/...</code>.
            </li>
          </ul>
        </div>
      </div>

      <ProductImportForm />

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-base font-semibold text-forest-900">
          Existing categories
        </h2>
        <p className="mt-1 text-sm text-muted">
          Use one of these slugs or names in the{" "}
          <code className="font-mono text-xs">category</code> column.
        </p>
        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No active categories yet.{" "}
            <Link
              href="/admin/categories/new"
              className="font-semibold text-forest-900 hover:underline"
            >
              Create a category first
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.slug}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-line bg-cream-100/60 px-3 py-1 text-xs"
              >
                <span className="font-medium text-forest-900">
                  {category.name}
                </span>
                <code className="font-mono text-[0.68rem] text-muted">
                  {category.slug}
                </code>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
