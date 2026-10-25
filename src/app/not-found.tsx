import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sprout } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="paper-texture flex min-h-dvh flex-col bg-cream-100">
      <div className="container-page flex h-20 items-center">
        <Logo />
      </div>

      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-16"
      >
        <div className="max-w-lg text-center">
          <Sprout aria-hidden="true" className="mx-auto size-10 text-gold-600" />
          <p className="mt-6 font-display text-6xl text-forest-900">404</p>
          <h1 className="mt-3 text-2xl font-semibold text-forest-900 sm:text-3xl">
            This page could not be found
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            The link may be out of date, or the page may have moved. Try the shop,
            or head back to the homepage.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">
                Back to home
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop">Browse the shop</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted">
            Need help?{" "}
            <Link href="/contact" className="link-underline font-medium text-forest-900">
              Contact us
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
