import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Leaf, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Ceylon Herbs and Spices is a home for Sri Lankan herbs, spices and natural products from the island of Sri Lanka, described honestly and sold with clear details.",
  alternates: { canonical: "/about" },
};

const standards = [
  {
    title: "Accurate product details",
    copy: "Ingredients, origin, packing, storage and usage notes are published on the product page wherever the information is available.",
  },
  {
    title: "No invented credentials",
    copy: "We do not display organic, fair-trade or quality certifications unless they have actually been granted and can be shown.",
  },
  {
    title: "No medical claims",
    copy: "Herbs and spices are sold as food, not medicine. Nothing on this site is presented as treating or preventing illness.",
  },
  {
    title: "Reviews that are moderated",
    copy: "Customer reviews are checked before publication. We do not write reviews on a customer's behalf.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0">
          <Image
            src="/images/covers/about-hero.jpg"
            alt="Sri Lankan herbs and spices arranged for a natural cover"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/70 to-forest-950/40" />
        </div>
        <div className="container-page relative py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow text-gold-300">Our story</p>
            <h1 className="mt-3 text-4xl leading-[1.08] font-semibold text-cream-50 sm:text-5xl">
              Built around one island&rsquo;s pantry.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream-200/90">
              {siteConfig.name} is an online store for Sri Lankan herbs, spices
              and natural products. Our job is simple: make it easy to see
              exactly what you are buying, where it comes from and what is inside
              the packet.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream-200/80">
              From the finest Ceylon cinnamon to hand-selected whole spices and dried herbs, every product we list is chosen with care and described with honesty. We believe good cooking starts with knowing your ingredients — so clarity comes before anything else.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-18">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Why Ceylon</p>
            <h2 className="mt-2 text-3xl leading-tight font-semibold text-forest-900">
              A place name that means something
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-ink-soft/90">
            <p>
              Ceylon cinnamon is named after the island it comes from, and it is
              not the only spice with a Sri Lankan identity. Pepper, cardamom,
              cloves, nutmeg, turmeric and ginger all grow here, each shaped by
              the soil and climate of the region it comes from.
            </p>
            <p>
              The island&rsquo;s food culture is built on these ingredients —
              tempered in coconut oil, ground fresh, added at the right moment.
              We want the same pantry to be available to anyone who wants to cook
              with it, wherever they live.
            </p>
            <p>
              That is the whole idea. No mythology, no miracle claims. Just good
              ingredients, clearly described.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-forest-900 text-cream-100">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Leaf aria-hidden="true" className="size-8 text-gold-400" />
            <h2 className="mt-5 text-3xl leading-tight font-semibold sm:text-4xl">
              What you will find here
            </h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Ceylon cinnamon and cinnamon products",
              "Whole and ground spices",
              "Dried herbs and herbal teas",
              "Natural products and gift packs",
              "Bulk quantities for kitchens and resellers",
              "Seasonal and limited offers",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-cream-200/80"
              >
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-gold-400"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-14 sm:py-18">
        <div className="max-w-2xl">
          <p className="eyebrow">How we work</p>
          <h2 className="mt-2 text-3xl leading-tight font-semibold text-forest-900">
            The standards we hold ourselves to
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            A store is only as good as the claims it is willing to leave out.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {standards.map((standard) => (
            <div
              key={standard.title}
              className="rounded-lg border border-line bg-white p-6"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-forest-900/6">
                <Check
                  aria-hidden="true"
                  className="size-4 text-forest-800"
                />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-forest-900">
                {standard.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {standard.copy}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-4 rounded-lg border border-dashed border-line-strong bg-cream-100/60 p-6">
          <X aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-earth-500" />
          <div>
            <p className="font-semibold text-forest-900">
              What you will not find on a product page
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Certification logos we have not earned, health claims, invented
              supplier stories, or reviews written by us. If a detail is
              unverified, it does not go on the page.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-cream-200/50">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-forest-900">
              Questions before you order?
            </h2>
            <p className="mt-1 text-sm text-muted">
              Ask about a product, a bulk quantity or delivery.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/contact">
                Contact us
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/categories">Browse categories</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
