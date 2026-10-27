import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteCopy } from "@/lib/content";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore Sri Lankan herbs, spices, teas and natural products by category.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const [categories, copy] = await Promise.all([
    db.category
      .findMany({
        where: { isActive: true, parentId: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
          imageAlt: true,
          _count: {
            select: { products: { where: { status: "PUBLISHED" } } },
          },
        },
      })
      .catch(() => []),
    getSiteCopy(),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0">
          <Image
            src="/images/covers/categories-hero.jpg"
            alt="Ceylon herbs and spices grouped by category"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/70 to-forest-950/40" />
        </div>
        <div className="container-page relative py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow text-gold-300">{copy.categories.hero.eyebrow}</p>
            <h1 className="mt-3 text-3xl leading-[1.1] font-semibold text-cream-50 sm:text-5xl">
              {copy.categories.hero.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-cream-200/90 sm:text-lg">
              {copy.categories.hero.body}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-14 sm:py-18">
        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-white/60 px-6 py-16 text-center">
            <Sprout
              aria-hidden="true"
              className="mx-auto size-9 text-gold-600"
            />
            <h2 className="mt-4 text-xl font-semibold text-forest-900">
              {copy.categories.empty.title}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              {copy.categories.empty.body}
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/contact">{copy.categories.empty.action}</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-gold-500/50 hover:shadow-soft"
                >
                  <div className="relative aspect-[5/3] overflow-hidden bg-cream-200">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.imageAlt || category.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="paper-texture flex h-full items-center justify-center bg-cream-200">
                        <span
                          aria-hidden="true"
                          className="font-display text-5xl text-earth-400/70"
                        >
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col px-5 py-5">
                    <h2 className="text-lg font-semibold text-forest-900">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">
                        {category.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="text-xs font-medium tracking-wide text-muted">
                        {category._count.products}{" "}
                        {category._count.products === 1
                          ? "product"
                          : "products"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-forest-900">
                        View
                        <ArrowRight
                          aria-hidden="true"
                          className="size-3.5 transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
