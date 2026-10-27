import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { db } from "@/lib/db";
import { formatMoneyDecimal } from "@/lib/money";
import { formatWeight, maxWeightGrams } from "@/lib/products/weight";
import { Button } from "@/components/ui/button";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse Sri Lankan herbs, spices and natural products from Ceylon Herbs and Spices.",
  alternates: { canonical: "/shop" },
};

import type { Prisma } from "@prisma/client";

function buildQuery(params: Record<string, string | undefined>) {
  const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };
  if (params.q) where.name = { contains: params.q, mode: "insensitive" };
  if (params.category) where.category = { slug: params.category };
  if (params.min || params.max) {
    const price: Prisma.DecimalFilter = {};
    if (params.min) price.gte = Number(params.min);
    if (params.max) price.lte = Number(params.max);
    where.price = price;
  }
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort === "price-asc") orderBy = { price: "asc" };
  if (params.sort === "price-desc") orderBy = { price: "desc" };
  if (params.sort === "name") orderBy = { name: "asc" };
  if (params.sort === "popular") orderBy = { salesCount: "desc" };
  return { where, orderBy };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const q = get("q");
  const category = get("category");
  const sort = get("sort");
  const min = get("min");
  const max = get("max");
  const page = Number(get("page") || "1");
  const perPage = 12;

  const { where, orderBy } = buildQuery({ q, category, sort, min, max });

  const [categories, products, total, copy] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } }),
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        saleMode: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.product.count({ where }),
    getSiteCopy(),
  ]);

  const pages = Math.ceil(total / perPage);

  return (
    <div className="container-page py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{copy.shop.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-semibold text-forest-900">{copy.shop.title}</h1>
          <p className="mt-1 text-sm text-muted">{total} {total === 1 ? "product" : "products"}</p>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="category" value={category ?? ""} />
          <input name="q" defaultValue={q ?? ""} placeholder={copy.shop.searchPlaceholder} className="h-10 rounded-md border border-line-strong px-3 text-sm" />
          <select name="sort" defaultValue={sort ?? "newest"} className="h-10 rounded-md border border-line-strong px-2 text-sm">
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name A–Z</option>
          </select>
          <Button type="submit" size="sm"><SlidersHorizontal className="size-4" /> Apply</Button>
        </form>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-forest-900">{copy.shop.filters}</p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/shop" className={`text-sm ${!category ? "font-semibold text-forest-900" : "text-muted hover:text-forest-900"}`}>{copy.shop.all}</Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/shop?category=${c.slug}`} className={`text-sm ${category === c.slug ? "font-semibold text-forest-900" : "text-muted hover:text-forest-900"}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div>
          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong py-16 text-center">
              <p className="text-base font-medium text-forest-900">{copy.shop.emptyTitle}</p>
              <p className="mt-1 text-sm text-muted">{copy.shop.emptyBody}</p>
              <Button asChild variant="outline" className="mt-4"><Link href="/shop">{copy.shop.clear}</Link></Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const img = product.images[0];
                const onSale = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
                return (
                  <Link key={product.id} href={`/shop/${product.slug}`} className="group overflow-hidden rounded-lg border border-line bg-white transition-all hover:-translate-y-0.5 hover:shadow-soft">
                    <div className="relative aspect-square bg-cream-200">
                      {img?.url ? (
                        <Image src={img.url} alt={img.alt || product.name} fill sizes="(min-width:1280px)25vw,(min-width:640px)33vw,50vw" className="object-cover transition-transform group-hover:scale-[1.02]" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted">No image</div>
                      )}
                      {onSale && <span className="absolute left-3 top-3 rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-cream-50">Sale</span>}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted">{product.category.name}</p>
                      <p className="mt-1 font-medium text-forest-900 group-hover:underline">{product.name}</p>
                      <div className="mt-2 flex flex-wrap items-baseline gap-2">
                        <span className="font-semibold text-forest-900">{formatMoneyDecimal(product.price.toString())}</span>
                        {product.saleMode === "WEIGHT" && (
                          <span className="text-xs text-muted">/ 100g</span>
                        )}
                        {onSale && <span className="text-sm text-muted line-through">{formatMoneyDecimal(product.compareAtPrice!.toString())}</span>}
                      </div>
                      {product.stock <= 0 ? (
                        <p className="mt-1 text-xs text-danger">Out of stock</p>
                      ) : product.saleMode === "WEIGHT" ? (
                        <p className="mt-1 text-xs text-muted">
                          {formatWeight(maxWeightGrams(product.stock))} available
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/shop?page=${p}${q ? `&q=${q}` : ""}${category ? `&category=${category}` : ""}${sort ? `&sort=${sort}` : ""}`} className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm ${p === page ? "bg-forest-900 text-cream-50" : "border border-line"}`}>
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
