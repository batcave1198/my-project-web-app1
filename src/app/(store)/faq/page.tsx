import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteCopy } from "@/lib/content";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about ordering, delivery, returns, payments and account questions at Ceylon Herbs and Spices.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [categories, copy] = await Promise.all([
    db.faqCategory
      .findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          items: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { question: "asc" }],
            select: { id: true, question: true, answer: true },
          },
        },
      })
      .catch(() => []),
    getSiteCopy(),
  ]);

  const populated = categories.filter((category) => category.items.length > 0);

  return (
    <div className="container-narrow py-14 sm:py-18">
      <div className="text-center">
        <p className="eyebrow">{copy.faq.hero.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
          {copy.faq.hero.title}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted">
          {copy.faq.hero.body}
        </p>
      </div>

      {populated.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line-strong bg-white/60 px-6 py-14 text-center">
          <HelpCircle aria-hidden="true" className="mx-auto size-9 text-gold-600" />
          <h2 className="mt-4 text-xl font-semibold text-forest-900">
            {copy.faq.empty.title}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            {copy.faq.empty.body}
          </p>
          <Button asChild className="mt-6">
            <Link href="/contact">{copy.faq.empty.action}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {populated.map((category) => (
            <section key={category.id} aria-labelledby={`faq-${category.slug}`}>
              <h2
                id={`faq-${category.slug}`}
                className="text-lg font-semibold text-forest-900"
              >
                {category.name}
              </h2>
              <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-white">
                {category.items.map((item) => (
                  <details key={item.id} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-ink marker:hidden">
                      {item.question}
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <div className="mt-3 space-y-2 pr-6 text-sm leading-relaxed whitespace-pre-line text-muted">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-lg border border-line bg-cream-100/60 p-6 text-center">
        <p className="font-semibold text-forest-900">{copy.faq.footer.title}</p>
        <p className="mt-1 text-sm text-muted">
          {copy.faq.footer.body}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/contact">{copy.faq.footer.action}</Link>
        </Button>
      </div>
    </div>
  );
}
