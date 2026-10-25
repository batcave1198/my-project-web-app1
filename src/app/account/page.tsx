import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

const links = [
  {
    href: "/account/orders",
    label: "My Orders",
    description: "Track current orders and revisit past purchases.",
    icon: Package,
  },
  {
    href: "/wishlist",
    label: "Wishlist",
    description: "Products you have saved for later.",
    icon: Heart,
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    description: "Delivery addresses saved to your account.",
    icon: MapPin,
  },
  {
    href: "/account/profile",
    label: "Profile",
    description: "Your name, phone number and password.",
    icon: UserRound,
  },
];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await requireUser("/account");
  const params = await searchParams;

  const orderCount = await db.order.count({ where: { userId: user.id } });
  const wishlistCount = await db.wishlistItem.count({
    where: { userId: user.id },
  });

  return (
    <div className="container-page py-12 sm:py-16">
      {params.welcome === "1" && (
        <div className="mb-8 rounded-lg border border-success/25 bg-success-soft px-5 py-4 text-sm text-success">
          Welcome to Ceylon Herbs and Spices. Your account is ready.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
            Hello, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="outline" size="sm">
            <LogOut aria-hidden="true" />
            Sign Out
          </Button>
        </form>
      </div>

      {!user.emailVerifiedAt && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-warning/25 bg-warning-soft px-5 py-4 text-sm text-warning">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            Your email address is not verified yet. Email verification is enabled
            once transactional email is configured.
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            Orders
          </p>
          <p className="mt-2 font-display text-4xl text-forest-900">
            {orderCount}
          </p>
          <Link
            href="/account/orders"
            className="link-underline mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-900"
          >
            View orders
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
        <div className="rounded-lg border border-line bg-white p-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            Wishlist
          </p>
          <p className="mt-2 font-display text-4xl text-forest-900">
            {wishlistCount}
          </p>
          <Link
            href="/wishlist"
            className="link-underline mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-900"
          >
            View wishlist
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex items-start gap-4 rounded-lg border border-line bg-cream-50 px-5 py-5 transition-colors hover:border-gold-500/50 hover:bg-white"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-900/6">
                <link.icon aria-hidden="true" className="size-4 text-forest-800" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-forest-900">
                  {link.label}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">
                  {link.description}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
