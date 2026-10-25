import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Flame,
  Leaf,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";
import { formatMoneyDecimal } from "@/lib/money";

export default async function HomePage() {
  const [categories, featuredProducts, newProducts] = await Promise.all([
    db.category
      .findMany({
        where: { isActive: true, parentId: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: 12,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
        },
      })
      .catch(() => []),
    db.product
      .findMany({
        where: { status: "PUBLISHED", isFeatured: true },
        orderBy: [{ updatedAt: "desc" }],
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          saleMode: true,
          shortDescription: true,
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { url: true, alt: true },
          },
        },
      })
      .catch(() => []),
    db.product
      .findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ createdAt: "desc" }],
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          saleMode: true,
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { url: true, alt: true },
          },
        },
      })
      .catch(() => []),
  ]);

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-line bg-cream-50">
        <div className="absolute inset-0">
          <Image
            src="/images/covers/home-hero.jpg"
            alt="A selection of Ceylon herbs and spices displayed naturally"
            fill
            priority
            className="object-cover brightness-[1.15]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-cream-50/92 sm:bg-transparent sm:bg-gradient-to-r sm:from-cream-50/98 sm:via-cream-50/94 sm:to-cream-50/68" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <svg
            className="absolute -top-16 -left-10 h-40 w-40 rotate-12 text-gold-500/10"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <ellipse cx="50" cy="35" rx="12" ry="18" />
            <ellipse
              cx="40"
              cy="50"
              rx="10"
              ry="16"
              transform="rotate(-20 40 50)"
            />
            <ellipse
              cx="60"
              cy="48"
              rx="10"
              ry="16"
              transform="rotate(15 60 48)"
            />
            <ellipse
              cx="46"
              cy="65"
              rx="9"
              ry="14"
              transform="rotate(-12 46 65)"
            />
            <ellipse
              cx="58"
              cy="66"
              rx="9"
              ry="14"
              transform="rotate(10 58 66)"
            />
          </svg>
          <svg
            className="absolute top-10 right-4 h-28 w-28 -rotate-15 text-earth-500/10 sm:right-12"
            viewBox="0 0 80 80"
            fill="currentColor"
          >
            <circle cx="25" cy="30" r="5" />
            <circle cx="35" cy="25" r="5" />
            <circle cx="45" cy="30" r="5" />
            <circle cx="30" cy="38" r="5" />
            <circle cx="40" cy="38" r="5" />
            <circle cx="35" cy="46" r="5" />
          </svg>
          <svg
            className="absolute bottom-8 left-1/3 h-24 w-24 rotate-45 text-gold-600/10"
            viewBox="0 0 70 70"
            fill="currentColor"
          >
            <path d="M35 8c2 6 6 10 12 12-6 2-10 6-12 12-2-6-6-10-12-12 6-2 10-6 12-12Z" />
            <path d="M22 38c1.5 4.5 4.5 7.5 9 9-4.5 1.5-7.5 4.5-9 9-1.5-4.5-4.5-7.5-9-9 4.5-1.5 7.5-4.5 9-9Z" />
            <path d="M48 42c1 3 3 5 6 6-3 1-5 3-6 6-1-3-3-5-6-6 3-1 5-3 6-6Z" />
          </svg>
        </div>

        <div className="container-page relative py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-cream-50/80 px-3.5 py-1.5 text-[0.7rem] font-semibold tracking-[0.16em] text-earth-600 uppercase shadow-[0_1px_0_rgb(201_162_39/0.12)]">
              <Leaf aria-hidden="true" className="size-3.5 text-gold-600" />
              Pure Ceylon herbs &amp; spices
            </p>

            <h1 className="mt-6 text-[2.65rem] leading-[1.1] font-semibold tracking-[-0.025em] text-forest-900 sm:text-[3.5rem] lg:text-[4.25rem]">
              The island&rsquo;s finest pantry,
              <span className="mt-1.5 block pb-1 text-earth-700 italic">
                brought to yours.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              {siteConfig.name} is a home for Ceylon cinnamon, whole spices,
              dried herbs and herbal teas — each product described honestly,
              with its origin, ingredients and packing details in plain sight.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-soft">
              Sourced from Sri Lanka and packed with care, our collection brings
              the true aroma and character of Ceylon spices straight to your
              kitchen.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="shadow-[0_10px_40px_-20px_rgb(20_33_26)]"
              >
                <Link href="/shop">
                  Shop the collection
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">Our story</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Secure checkout",
                  copy: "Payments verified server-side",
                },
                {
                  icon: ClipboardList,
                  title: "Order tracking",
                  copy: "Follow every stage",
                },
                {
                  icon: BadgeCheck,
                  title: "Clear details",
                  copy: "Ingredients & origin listed",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-2.5">
                  <item.icon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-gold-600"
                  />
                  <div>
                    <dt className="text-sm font-semibold text-forest-900">
                      {item.title}
                    </dt>
                    <dd className="mt-0.5 text-xs leading-snug text-ink-soft">
                      {item.copy}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- categories */}
      <section
        aria-labelledby="categories-heading"
        className="bg-cream-50 py-18 sm:py-24"
      >
        <div className="container-page">
          <SectionHeading
            eyebrow="Browse the pantry"
            title="Every shelf of a Sri Lankan kitchen"
            description="Categories are managed from the admin dashboard, so this list always reflects what the store actually carries."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/categories">
                  All categories
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            }
          />

          {categories.length === 0 ? (
            <div className="mt-10 rounded-lg border border-dashed border-line-strong bg-white/60 px-6 py-14 text-center">
              <Leaf
                aria-hidden="true"
                className="mx-auto size-8 text-gold-600"
              />
              <h3 className="mt-4 text-xl font-semibold text-forest-900">
                The first collection is being prepared
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Categories added in the admin dashboard will appear here
                automatically. Nothing is hardcoded into the storefront.
              </p>
            </div>
          ) : (
            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <li key={category.id}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(category.slug)}`}
                    className="group relative flex h-full items-center gap-4 overflow-hidden rounded-lg border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-[0_25px_60px_-40px_rgb(20_33_26)]"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-line-strong bg-cream-200">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          sizes="64px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 64 64"
                          className="h-full w-full text-earth-500/30"
                          fill="currentColor"
                        >
                          <ellipse cx="32" cy="24" rx="8" ry="12" />
                          <ellipse
                            cx="26"
                            cy="34"
                            rx="7"
                            ry="11"
                            transform="rotate(-18 26 34)"
                          />
                          <ellipse
                            cx="38"
                            cy="33"
                            rx="7"
                            ry="11"
                            transform="rotate(16 38 33)"
                          />
                          <ellipse
                            cx="30"
                            cy="44"
                            rx="6"
                            ry="10"
                            transform="rotate(-10 30 44)"
                          />
                          <ellipse
                            cx="36"
                            cy="45"
                            rx="6"
                            ry="10"
                            transform="rotate(12 36 45)"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="relative min-w-0 flex-1">
                      <span className="block text-base font-semibold text-forest-900">
                        {category.name}
                      </span>
                      {category.description && (
                        <span className="mt-1 line-clamp-2 block text-sm leading-snug text-muted">
                          {category.description}
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className="relative hidden font-display text-lg text-gold-600/70 transition-colors group-hover:text-gold-600 sm:block"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="relative size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-forest-900"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {(featuredProducts.length > 0 || newProducts.length > 0) && (
        <section className="relative overflow-hidden bg-cream-50 pb-18 sm:pb-24">
          <div className="container-page relative space-y-14">
            {featuredProducts.length > 0 && (
              <div>
                <SectionHeading
                  eyebrow="Hand-picked for the pantry"
                  title="Featured products"
                  description="A curated selection of our most-loved Ceylon herbs and spices."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link href="/shop">
                        View all
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  }
                />
                <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredProducts.map((product) => {
                    const image = product.images[0];
                    const onSale =
                      product.compareAtPrice &&
                      Number(product.compareAtPrice) > Number(product.price);
                    return (
                      <Link
                        key={product.id}
                        href={`/shop/${product.slug}`}
                        className="group overflow-hidden rounded-lg border border-line bg-white shadow-[0_1px_0_rgb(20_33_26/0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-50px_rgb(20_33_26)]"
                      >
                        <div className="relative aspect-square overflow-hidden bg-cream-200">
                          {image?.url ? (
                            <Image
                              src={image.url}
                              alt={image.alt || product.name}
                              fill
                              sizes="(min-width:1024px)25vw, (min-width:640px)50vw, 100vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ShoppingBag
                                aria-hidden="true"
                                className="size-7 text-muted/60"
                              />
                            </div>
                          )}
                          {onSale && (
                            <span className="absolute top-3 left-3 rounded-full bg-danger px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-[0.14em] text-white uppercase">
                              Sale
                            </span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-forest-950/10 to-transparent" />
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-semibold text-forest-900 transition-colors group-hover:text-forest-800">
                            {product.name}
                          </p>
                          {product.shortDescription && (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                              {product.shortDescription}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-baseline gap-2">
                            <span className="text-sm font-semibold text-forest-900">
                              {formatMoneyDecimal(product.price.toString())}
                            </span>
                            {product.saleMode === "WEIGHT" && (
                              <span className="text-xs text-muted">/ 100g</span>
                            )}
                            {onSale && (
                              <span className="text-xs text-muted line-through">
                                {formatMoneyDecimal(
                                  product.compareAtPrice!.toString(),
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {newProducts.length > 0 && (
              <div>
                <SectionHeading
                  eyebrow="Fresh from the pantry"
                  title="New arrivals"
                  description="Recently added products, pulled straight from the catalogue."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link href="/shop?sort=newest">
                        Shop newest
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  }
                />
                <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {newProducts.map((product) => {
                    const image = product.images[0];
                    const onSale =
                      product.compareAtPrice &&
                      Number(product.compareAtPrice) > Number(product.price);
                    return (
                      <Link
                        key={product.id}
                        href={`/shop/${product.slug}`}
                        className="group overflow-hidden rounded-lg border border-line bg-white shadow-[0_1px_0_rgb(20_33_26/0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-50px_rgb(20_33_26)]"
                      >
                        <div className="relative aspect-square overflow-hidden bg-cream-200">
                          {image?.url ? (
                            <Image
                              src={image.url}
                              alt={image.alt || product.name}
                              fill
                              sizes="(min-width:1024px)25vw, (min-width:640px)50vw, 100vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Flame
                                aria-hidden="true"
                                className="size-7 text-muted/60"
                              />
                            </div>
                          )}
                          {onSale && (
                            <span className="absolute top-3 left-3 rounded-full bg-danger px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-[0.14em] text-white uppercase">
                              Sale
                            </span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-forest-950/10 to-transparent" />
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-semibold text-forest-900 transition-colors group-hover:text-forest-800">
                            {product.name}
                          </p>
                          <div className="mt-2 flex flex-wrap items-baseline gap-2">
                            <span className="text-sm font-semibold text-forest-900">
                              {formatMoneyDecimal(product.price.toString())}
                            </span>
                            {product.saleMode === "WEIGHT" && (
                              <span className="text-xs text-muted">/ 100g</span>
                            )}
                            {onSale && (
                              <span className="text-xs text-muted line-through">
                                {formatMoneyDecimal(
                                  product.compareAtPrice!.toString(),
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------- story */}
      <section className="border-y border-line bg-forest-900 text-cream-100">
        <div className="container-page grid gap-12 py-18 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-gold-300 uppercase">
              Why Ceylon
            </p>
            <h2
              id="story-heading"
              className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl"
            >
              Spices with a place name,
              <br />
              not just a label.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-cream-200/80">
            <p>
              Ceylon cinnamon is named after the island it comes from. The same
              is true of the pepper, cardamom, cloves, turmeric and ginger that
              fill Sri Lankan kitchens — each with a character shaped by where
              it grows.
            </p>
            <p>
              Our aim is simple: describe every product accurately, publish the
              details a buyer actually needs, and let the spice speak for
              itself. Where a detail is not verified, we leave it out rather
              than dress it up.
            </p>
            <div className="pt-2">
              <Button asChild variant="gold" size="md">
                <Link href="/about">
                  Read our story
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- spice highlights */}
      <section className="relative overflow-hidden border-y border-line bg-forest-900 text-cream-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
          <svg
            className="absolute top-10 right-10 h-32 w-32 rotate-12 text-gold-400/10"
            viewBox="0 0 80 80"
            fill="currentColor"
          >
            <ellipse cx="40" cy="28" rx="10" ry="16" />
            <ellipse
              cx="32"
              cy="42"
              rx="8"
              ry="14"
              transform="rotate(-16 32 42)"
            />
            <ellipse
              cx="48"
              cy="41"
              rx="8"
              ry="14"
              transform="rotate(14 48 41)"
            />
            <ellipse
              cx="36"
              cy="56"
              rx="7"
              ry="12"
              transform="rotate(-10 36 56)"
            />
            <ellipse
              cx="44"
              cy="57"
              rx="7"
              ry="12"
              transform="rotate(10 44 57)"
            />
          </svg>
        </div>
        <div className="container-page relative py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-gold-300 uppercase">
                Icons of Ceylon
              </p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
                Spice highlights
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-200/75">
                Time-honoured Sri Lankan staples — cinnamon, pepper, cloves and
                cardamom. Browse them directly from the shop.
              </p>
            </div>
            <Button asChild variant="gold" size="sm">
              <Link href="/shop">
                Browse all spices
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Ceylon Cinnamon",
                slug: "ceylon-cinnamon",
                description: "Sweet, warm and delicately fragrant.",
              },
              {
                name: "Black Pepper",
                slug: "black-pepper",
                description: "Bold, earthy heat for everyday cooking.",
              },
              {
                name: "Cloves",
                slug: "cloves",
                description: "Rich, aromatic and deeply warm.",
              },
              {
                name: "Cardamom",
                slug: "cardamom",
                description: "Floral, sweet and distinctly Ceylon.",
              },
            ].map((item) => (
              <Link
                key={item.name}
                href={`/shop?search=${encodeURIComponent(item.name)}`}
                className="group relative overflow-hidden rounded-lg border border-cream-100/10 bg-cream-50/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:bg-cream-50/10"
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold-400/10 blur-2xl transition-opacity group-hover:opacity-80"
                />
                <div className="relative">
                  <p className="font-display text-2xl text-cream-50">
                    {item.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-cream-200/70">
                    {item.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-300 transition-transform group-hover:translate-x-1">
                    Shop now
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- values */}
      <section
        aria-labelledby="values-heading"
        className="bg-cream-50 py-18 sm:py-24"
      >
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow="How we sell"
            title="A straightforward shopping experience"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Server-verified payments",
                copy: "Orders are only marked paid after the payment gateway confirms the transaction server-side.",
              },
              {
                icon: ClipboardList,
                title: "Order tracking that works",
                copy: "Guest and account orders both get a tracked timeline from confirmation through delivery.",
              },
              {
                icon: BadgeCheck,
                title: "Details before you buy",
                copy: "Ingredients, origin, packing, storage and usage notes are shown on every product where provided.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-line bg-white p-7 shadow-[0_1px_0_rgb(20_33_26/0.03)]"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-forest-900/6">
                  <item.icon
                    aria-hidden="true"
                    className="size-5 text-forest-800"
                  />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-forest-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- newsletter */}
      <section className="border-t border-line bg-cream-200/60 py-16">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-forest-900 sm:text-3xl">
              New arrivals and seasonal offers
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
              Occasional emails about new spices, gift packs and discounts. No
              daily noise, and you can unsubscribe at any time.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
