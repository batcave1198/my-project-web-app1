import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Leaf, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Ceylon Herbs and Spices is a home for Sri Lankan herbs, spices and natural products from the island of Sri Lanka, described honestly and sold with clear details.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const copy = await getSiteCopy();

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
            <p className="eyebrow text-gold-300">{copy.about.hero.eyebrow}</p>
            <h1 className="mt-3 text-4xl leading-[1.08] font-semibold text-cream-50 sm:text-5xl">
              {copy.about.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream-200/90">
              {copy.about.hero.body}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream-200/80">
              {copy.about.hero.bodySecondary}
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-18">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">{copy.about.why.eyebrow}</p>
            <h2 className="mt-2 text-3xl leading-tight font-semibold text-forest-900">
              {copy.about.why.title}
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-ink-soft/90">
            <p>{copy.about.why.body}</p>
            <p>{copy.about.why.bodySecondary}</p>
            <p>{copy.about.why.bodyTertiary}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-forest-900 text-cream-100">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Leaf aria-hidden="true" className="size-8 text-gold-400" />
            <h2 className="mt-5 text-3xl leading-tight font-semibold sm:text-4xl">
              {copy.about.range.title}
            </h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {copy.about.range.items.map((item) => (
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
          <p className="eyebrow">{copy.about.standards.eyebrow}</p>
          <h2 className="mt-2 text-3xl leading-tight font-semibold text-forest-900">
            {copy.about.standards.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            {copy.about.standards.intro}
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {copy.about.standards.items.map((standard, index) => (
            <div
              key={`${standard.title}-${index}`}
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
              {copy.about.exclusions.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {copy.about.exclusions.body}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-cream-200/50">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-forest-900">
              {copy.about.cta.title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {copy.about.cta.body}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/contact">
                {copy.about.cta.primary}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/categories">{copy.about.cta.secondary}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
