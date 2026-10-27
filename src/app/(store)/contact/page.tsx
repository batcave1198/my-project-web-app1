import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/store/contact-form";
import { SocialLinks } from "@/components/layout/social-links";
import { getSiteCopy, getSocialLinks } from "@/lib/content";
import { formatAddress, getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Ask a question about Sri Lankan herbs, spices, an order or a bulk enquiry. Send us a message and we will reply by email.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, copy, social] = await Promise.all([
    getStoreSettings(),
    getSiteCopy(),
    getSocialLinks(),
  ]);
  const address = formatAddress(settings);
  const hasDetails = Boolean(
    settings.storeEmail ||
      settings.storePhone ||
      settings.whatsapp ||
      address ||
      settings.businessHours,
  );
  const hasSocial = Object.values(social).some(Boolean);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0">
          <Image
            src="/images/covers/contact-hero.jpg"
            alt="Fresh Sri Lankan herbs and spices ready to be packed"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/70 to-forest-950/40" />
        </div>
        <div className="container-page relative py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="eyebrow text-gold-300">{copy.contact.hero.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold text-cream-50 sm:text-4xl">
              {copy.contact.hero.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-cream-200/90">
              {copy.contact.hero.body}
            </p>
            <p className="mt-3 text-base leading-relaxed text-cream-200/80">
              {copy.contact.hero.bodySecondary}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-14 sm:py-18">

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-lg border border-line bg-cream-100/60 p-6">
          <h2 className="text-lg font-semibold text-forest-900">
            {copy.contact.details.title}
          </h2>

          {hasDetails ? (
            <address className="mt-4 space-y-3.5 text-sm not-italic text-ink-soft">
              {settings.storeEmail && (
                <a
                  href={`mailto:${settings.storeEmail}`}
                  className="flex items-start gap-3 transition-colors hover:text-forest-900"
                >
                  <Mail
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-gold-600"
                  />
                  <span className="break-all">{settings.storeEmail}</span>
                </a>
              )}
              {settings.storePhone && (
                <a
                  href={`tel:${settings.storePhone.replace(/\s+/g, "")}`}
                  className="flex items-start gap-3 transition-colors hover:text-forest-900"
                >
                  <Phone
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-gold-600"
                  />
                  <span>{settings.storePhone}</span>
                </a>
              )}
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 transition-colors hover:text-forest-900"
                >
                  <MessageCircle
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-gold-600"
                  />
                  <span>WhatsApp</span>
                </a>
              )}
              {address && (
                <span className="flex items-start gap-3">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-gold-600"
                  />
                  <span>{address}</span>
                </span>
              )}
              {settings.businessHours && (
                <span className="flex items-start gap-3">
                  <Clock
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-gold-600"
                  />
                  <span>{settings.businessHours}</span>
                </span>
              )}
            </address>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {copy.contact.details.empty}
            </p>
          )}

          <div className="mt-6 border-t border-line pt-5 text-sm">
            <p className="font-medium text-forest-900">
              {copy.contact.details.quickTitle}
            </p>
            <p className="mt-1 text-muted">
              <Link href="/faq" className="link-underline font-medium text-forest-900">
                FAQ
              </Link>{" "}
              — {copy.contact.details.quickBody}
            </p>
          </div>

          {hasSocial && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-sm font-medium text-forest-900">Follow us</p>
              <SocialLinks links={social} tone="dark" className="mt-3" />
            </div>
          )}
        </aside>

        <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-forest-900">
            {copy.contact.form.title}
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted">
            {copy.contact.form.body}
          </p>
          <ContactForm />
        </div>
      </div>
      </div>
    </div>
  );
}
