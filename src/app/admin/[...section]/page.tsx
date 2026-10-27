import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";

/**
 * Placeholder for admin modules that are built in later phases. Anything not
 * in this whitelist is a genuine 404 — we never mask typos.
 */
const modules: Record<string, { title: string; description: string }> = {
  products: {
    title: "Products",
    description:
      "Create, edit, publish and archive products, manage variants, media, stock and per-product discounts.",
  },
  "products/import": {
    title: "Bulk Product Import",
    description:
      "Upload a CSV, preview every row, fix validation errors, then import in create, update or upsert mode with live progress.",
  },
  categories: {
    title: "Categories",
    description:
      "Organise the catalogue into nested categories with images, ordering and SEO fields.",
  },
  orders: {
    title: "Orders",
    description:
      "Review orders, confirm payments, move fulfilment status, add tracking numbers and export order data.",
  },
  customers: {
    title: "Customers",
    description:
      "See registered customers, their order history and account status.",
  },
  discounts: {
    title: "Discounts & Coupons",
    description:
      "Run store-wide promotions and issue percentage, fixed-amount or free-shipping coupon codes.",
  },
  reviews: {
    title: "Reviews",
    description:
      "Moderate customer reviews before they appear on product pages, and reply publicly.",
  },
  content: {
    title: "Pages & FAQ",
    description:
      "Edit every public content page and FAQ entry without a deploy.",
  },
  "contact-messages": {
    title: "Contact Messages",
    description:
      "Read enquiries from the contact form, track their status and keep internal notes.",
  },
  settings: {
    title: "Settings",
    description:
      "Store details, contact information, shipping zones and payment configuration. Public page copy and social links are edited in the content folder.",
  },
  "audit-logs": {
    title: "Audit Logs",
    description:
      "A permanent record of every administrative change, with actor, entity and timestamp.",
  },
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminSectionPlaceholder({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  const key = section.join("/");
  const entry = modules[key];

  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-forest-900"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Dashboard
      </Link>

      <div className="mt-6 rounded-lg border border-line bg-white px-6 py-12 text-center sm:px-10">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-cream-200">
          <Construction aria-hidden="true" className="size-5 text-earth-600" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-forest-900">
          {entry.title}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          {entry.description}
        </p>
        <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-earth-500 uppercase">
          This module is not enabled in the current build
        </p>
      </div>
    </div>
  );
}
