import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SocialLinks } from "@/components/layout/social-links";
import { paymentMethods, footerNav, siteConfig } from "@/lib/site";
import { formatAddress, getStoreSettings } from "@/lib/settings";
import { getSiteCopy, getSocialLinks } from "@/lib/content";

export async function SiteFooter() {
  const [settings, copy, social] = await Promise.all([
    getStoreSettings(),
    getSiteCopy(),
    getSocialLinks(),
  ]);
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
              {copy.footer.description}
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

            <SocialLinks links={social} tone="light" className="mt-6" />
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
