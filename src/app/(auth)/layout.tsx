import Link from "next/link";
import { Leaf, ShieldCheck, ClipboardList } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-forest-950 px-12 py-14 lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 15%, #e6cd85 0, transparent 38%), radial-gradient(circle at 80% 85%, #c9a227 0, transparent 42%)",
          }}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 400 400"
          className="absolute -right-24 -bottom-24 size-[30rem] text-gold-400/20"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        >
          <circle cx="200" cy="200" r="180" />
          <circle cx="200" cy="200" r="140" strokeDasharray="2 6" />
          <circle cx="200" cy="200" r="100" />
        </svg>

        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative mt-auto max-w-sm">
          <p className="font-display text-3xl leading-snug text-cream-50">
            Sri Lankan herbs and spices, described honestly.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-cream-200/70">
            <li className="flex items-start gap-3">
              <Leaf aria-hidden="true" className="mt-0.5 size-4 text-gold-400" />
              Ceylon cinnamon, whole spices, dried herbs and herbal teas
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-4 text-gold-400"
              />
              Payments confirmed server-side before an order is accepted
            </li>
            <li className="flex items-start gap-3">
              <ClipboardList
                aria-hidden="true"
                className="mt-0.5 size-4 text-gold-400"
              />
              Order tracking for guest and account orders
            </li>
          </ul>
        </div>
      </aside>

      <main id="main-content" className="flex flex-col bg-cream-50">
        <div className="flex items-center justify-between px-5 py-5 lg:px-10">
          <div className="lg:invisible">
            <Logo />
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-muted transition-colors hover:text-forest-900"
          >
            Back to store
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
