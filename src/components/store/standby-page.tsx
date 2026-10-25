import type { LucideIcon } from "lucide-react";

/**
 * Honest stand-in for a storefront section that is not enabled yet. Used only
 * while the catalogue and cart modules are being built — replaced by real
 * pages, never shipped as a placeholder on a live store.
 */
export function StandbyPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page py-16 sm:py-20">
      <div className="mx-auto max-w-2xl rounded-xl border border-line bg-white px-6 py-14 text-center shadow-soft sm:px-12">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-cream-200">
          <Icon aria-hidden="true" className="size-6 text-earth-600" />
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-earth-500 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted">
          {description}
        </p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}
