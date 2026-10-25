import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { paymentMethods, footerNav, siteConfig } from "@/lib/site";
import {
  formatAddress,
  getStoreSettings,
  hasSocialLinks,
} from "@/lib/settings";
import type { SocialLinks } from "@/lib/site";

const socialMeta: Array<{
  key: keyof SocialLinks;
  label: string;
  path: string;
}> = [
  {
    key: "facebook",
    label: "Facebook",
    path: "M13.5 21v-7.5h2.5l.4-2.9h-2.9V8.8c0-.84.23-1.41 1.44-1.41h1.54V4.8c-.27-.04-1.19-.11-2.26-.11-2.24 0-3.77 1.37-3.77 3.88v2.16H8v2.9h2.45V21h3.05Z",
  },
  {
    key: "instagram",
    label: "Instagram",
    path: "M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm0 6.27a2.47 2.47 0 1 1 0-4.94 2.47 2.47 0 0 1 0 4.94Zm4.85-6.42a.89.89 0 1 1-1.77 0 .89.89 0 0 1 1.77 0ZM12 5.9c-1.66 0-1.87.01-2.52.04-.65.03-1.1.13-1.49.29-.4.15-.74.36-1.08.7-.34.34-.55.68-.7 1.08-.16.39-.26.84-.29 1.49-.03.65-.04.86-.04 2.52s.01 1.87.04 2.52c.03.65.13 1.1.29 1.49.15.4.36.74.7 1.08.34.34.68.55 1.08.7.39.16.84.26 1.49.29.65.03.86.04 2.52.04s1.87-.01 2.52-.04c.65-.03 1.1-.13 1.49-.29.4-.15.74-.36 1.08-.7.34-.34.55-.68.7-1.08.16-.39.26-.84.29-1.49.03-.65.04-.86.04-2.52s-.01-1.87-.04-2.52c-.03-.65-.13-1.1-.29-1.49a2.98 2.98 0 0 0-.7-1.08 2.98 2.98 0 0 0-1.08-.7c-.39-.16-.84-.26-1.49-.29-.65-.03-.86-.04-2.52-.04Zm0 1.21c1.63 0 1.82.01 2.47.04.6.03.92.13 1.13.21.29.11.49.25.7.46.21.21.35.41.46.7.08.21.18.53.21 1.13.03.65.04.84.04 2.47s-.01 1.82-.04 2.47c-.03.6-.13.92-.21 1.13-.11.29-.25.49-.46.7-.21.21-.41.35-.7.46-.21.08-.53.18-1.13.21-.65.03-.84.04-2.47.04s-1.82-.01-2.47-.04c-.6-.03-.92-.13-1.13-.21a1.88 1.88 0 0 1-.7-.46 1.88 1.88 0 0 1-.46-.7c-.08-.21-.18-.53-.21-1.13-.03-.65-.04-.84-.04-2.47s.01-1.82.04-2.47c.03-.6.13-.92.21-1.13.11-.29.25-.49.46-.7.21-.21.41-.35.7-.46.21-.08.53-.18 1.13-.21.65-.03.84-.04 2.47-.04Z",
  },
  {
    key: "tiktok",
    label: "TikTok",
    path: "M16.6 5.82A5.1 5.1 0 0 0 15.6 3h-2.5v11.1a2.32 2.32 0 1 1-1.75-2.26V9.3a4.85 4.85 0 1 0 4.2 4.8V8.6a7.3 7.3 0 0 0 3.3 1.03V7.1a4.6 4.6 0 0 1-2.25-1.28Z",
  },
  {
    key: "youtube",
    label: "YouTube",
    path: "M21.1 8.2a2.5 2.5 0 0 0-1.76-1.77C17.8 6 12 6 12 6s-5.8 0-7.34.43A2.5 2.5 0 0 0 2.9 8.2 26 26 0 0 0 2.47 12c0 1.28.14 2.55.43 3.8a2.5 2.5 0 0 0 1.76 1.77C6.2 18 12 18 12 18s5.8 0 7.34-.43a2.5 2.5 0 0 0 1.76-1.77c.29-1.25.43-2.52.43-3.8s-.14-2.55-.43-3.8ZM10.1 14.7V9.3l4.63 2.7-4.63 2.7Z",
  },
];

function SocialIcon({
  path,
  label,
  href,
}: {
  path: string;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer me"
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-full border border-cream-100/15 text-cream-200 transition-colors hover:border-gold-400/60 hover:text-gold-300"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
        <path d={path} />
      </svg>
    </a>
  );
}

export async function SiteFooter() {
  const settings = await getStoreSettings();
  const address = formatAddress(settings);
  const payhereConfigured = Boolean(process.env.PAYHERE_MERCHANT_ID);
  const year = new Date().getFullYear();

  const columns = [
    { title: "Shop", links: footerNav.shop },
    { title: "Customer", links: footerNav.customer },
    { title: "Help", links: footerNav.help },
    { title: "Company", links: footerNav.company },
    { title: "Legal", links: footerNav.legal },
  ];

  return (
    <footer className="mt-auto bg-forest-950 text-cream-200">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo tone="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-200/75">
              {siteConfig.description}
            </p>

            <address className="mt-6 space-y-2.5 text-sm not-italic text-cream-200/75">
              {settings.storeEmail && (
                <a
                  href={`mailto:${settings.storeEmail}`}
                  className="flex items-start gap-2.5 transition-colors hover:text-cream-50"
                >
                  <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-400" />
                  <span className="break-all">{settings.storeEmail}</span>
                </a>
              )}
              {settings.storePhone && (
                <a
                  href={`tel:${settings.storePhone.replace(/\s+/g, "")}`}
                  className="flex items-start gap-2.5 transition-colors hover:text-cream-50"
                >
                  <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-400" />
                  <span>{settings.storePhone}</span>
                </a>
              )}
              {address && (
                <span className="flex items-start gap-2.5">
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-400" />
                  <span>{address}</span>
                </span>
              )}
              {settings.businessHours && (
                <span className="block pl-[1.65rem] text-cream-200/60">
                  {settings.businessHours}
                </span>
              )}
            </address>

            {hasSocialLinks(settings.social) && (
              <div className="mt-6 flex items-center gap-2">
                {socialMeta
                  .filter((item) => settings.social[item.key])
                  .map((item) => (
                    <SocialIcon
                      key={item.key}
                      path={item.path}
                      label={item.label}
                      href={settings.social[item.key]}
                    />
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-[0.7rem] font-semibold tracking-[0.18em] text-gold-300 uppercase">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-cream-200/75 transition-colors hover:text-cream-50"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-cream-100/10 pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-cream-200/55">
              © {year} {siteConfig.name}. All rights reserved.
            </p>

            {payhereConfigured && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="sr-only">Accepted payment methods</span>
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    aria-hidden="true"
                    className="rounded border border-cream-100/15 px-2 py-1 text-[0.65rem] font-semibold tracking-wide text-cream-200/70"
                  >
                    {method}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
