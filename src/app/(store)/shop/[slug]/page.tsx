import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoneyDecimal, STORE_CURRENCY } from "@/lib/money";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, seoTitle: true, seoDescription: true, shortDescription: true, ogImageUrl: true, images: { take: 1 } },
  });
  if (!product) return { title: "Product not found" };
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.shortDescription || undefined;
  const image = product.ogImageUrl || product.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product || product.status !== "PUBLISHED") notFound();

  const purchaseVariants = product.variants.map((variant) => ({
    id: variant.id,
    label: variant.label,
    price: formatMoneyDecimal(variant.price.toString()),
    compareAt:
      variant.compareAtPrice && Number(variant.compareAtPrice) > Number(variant.price)
        ? formatMoneyDecimal(variant.compareAtPrice.toString())
        : null,
    stock: variant.stock,
    sku: variant.sku,
  }));

  const baseCompareAt =
    product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
      ? formatMoneyDecimal(product.compareAtPrice.toString())
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || product.name,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: STORE_CURRENCY,
      price: Number(product.price).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const related = await db.product.findMany({
    where: { status: "PUBLISHED", categoryId: product.categoryId, NOT: { id: product.id } },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      saleMode: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
    },
  });

  return (
    <div className="container-page py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-8 text-sm text-muted">
        <Link href="/" className="hover:text-forest-900">Home</Link> / <Link href="/shop" className="hover:text-forest-900">Shop</Link> / <Link href={`/shop?category=${product.category.slug}`} className="hover:text-forest-900">{product.category.name}</Link> / <span className="text-forest-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {product.images[0] && (
            <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-cream-200">
              <Image src={product.images[0].url} alt={product.images[0].alt || product.name} fill sizes="(min-width:1024px)50vw,100vw" className="object-cover" priority />
            </div>
          )}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-md border border-line bg-cream-200">
                  <Image src={img.url} alt={img.alt || product.name} fill sizes="25vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
          {product.videos.length > 0 && (
            <video src={product.videos[0].url} controls className="w-full rounded-lg border border-line" />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted">{product.category.name}</p>
            <h1 className="mt-1 text-3xl font-semibold text-forest-900">{product.name}</h1>
          </div>

          <ProductPurchasePanel
            productId={product.id}
            sku={product.sku}
            saleMode={product.saleMode}
            basePrice={formatMoneyDecimal(product.price.toString())}
            basePriceValue={product.price.toString()}
            baseCompareAt={baseCompareAt}
            baseCompareAtValue={
              product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
                ? product.compareAtPrice.toString()
                : null
            }
            baseStock={product.stock}
            variants={product.saleMode === "WEIGHT" ? [] : purchaseVariants}
          />

          {product.shortDescription && <p className="text-base leading-relaxed text-ink-soft">{product.shortDescription}</p>}

          <div className="rounded-lg border border-line bg-cream-100/40 p-4 text-sm text-muted">
            <p className="font-medium text-forest-900">Delivery</p>
            <p className="mt-1">Delivery rates are calculated at checkout based on your district.</p>
          </div>
        </div>
      </div>

      {(product.description || product.specs.length > 0) && (
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {product.description && (
            <div>
              <h2 className="text-xl font-semibold text-forest-900">Description</h2>
              <div className="prose mt-4 max-w-none text-ink-soft whitespace-pre-line">{product.description}</div>
            </div>
          )}
          {product.specs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-forest-900">Product details</h2>
              <dl className="mt-4 divide-y divide-line rounded-lg border border-line">
                {product.specs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <dt className="text-muted">{s.label}</dt>
                    <dd className="text-forest-900">{s.value}</dd>
                  </div>
                ))}
                {product.origin && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Origin</dt><dd className="text-forest-900">{product.origin}</dd></div>}
                {product.ingredients && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Ingredients</dt><dd className="text-forest-900">{product.ingredients}</dd></div>}
                {product.packagingDetails && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Packaging</dt><dd className="text-forest-900">{product.packagingDetails}</dd></div>}
                {product.storageInstructions && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Storage</dt><dd className="text-forest-900">{product.storageInstructions}</dd></div>}
                {product.usageInstructions && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Usage</dt><dd className="text-forest-900">{product.usageInstructions}</dd></div>}
                {product.allergenInfo && <div className="flex items-center justify-between px-4 py-3 text-sm"><dt className="text-muted">Allergen info</dt><dd className="text-forest-900">{product.allergenInfo}</dd></div>}
              </dl>
            </div>
          )}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-forest-900">Related products</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => {
              const img = p.images[0];
              const sale = p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price);
              return (
                <Link key={p.id} href={`/shop/${p.slug}`} className="group overflow-hidden rounded-lg border border-line bg-white">
                  <div className="relative aspect-square bg-cream-200">
                    {img?.url ? <Image src={img.url} alt={img.alt || p.name} fill className="object-cover" /> : <div className="flex h-full items-center justify-center text-muted">No image</div>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-forest-900 group-hover:underline">{p.name}</p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-forest-900">{formatMoneyDecimal(p.price.toString())}</span>
                      {p.saleMode === "WEIGHT" && (
                        <span className="text-xs text-muted">/ 100g</span>
                      )}
                      {sale && <span className="text-xs text-muted line-through">{formatMoneyDecimal(p.compareAtPrice!.toString())}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
