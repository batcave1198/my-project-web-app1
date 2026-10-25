import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/store/contact-form";
import { formatAddress, getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Ask a question about Sri Lankan herbs, spices, an order or a bulk enquiry. Send us a message and we will reply by email.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const address = formatAddress(settings);
  const hasDetails = Boolean(
    settings.storeEmail ||
      settings.storePhone ||
      settings.whatsapp ||
      address ||
      settings.businessHours,
  );

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
            <p className="eyebrow text-gold-300">Contact</p>
            <h1 className="mt-2 text-3xl font-semibold text-cream-50 sm:text-4xl">
              Talk to us
            </h1>
            <p className="mt-3 text-base leading-relaxed text-cream-200/90">
              Questions about a product, a bulk order or an existing purchase? Send a
              message and it goes straight to the store&rsquo;s inbox.
            </p>
            <p className="mt-3 text-base leading-relaxed text-cream-200/80">
              Whether you need help choosing the right spice for your recipe or want to enquire about larger quantities, we are happy to help.
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-14 sm:py-18">

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-lg border border-line bg-cream-100/60 p-6">
          <h2 className="text-lg font-semibold text-forest-900">
            Store details
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
              Direct phone and email details have not been published yet. The
              form reaches the same inbox, so please use it in the meantime.
            </p>
          )}

          <div className="mt-6 border-t border-line pt-5 text-sm">
            <p className="font-medium text-forest-900">Looking for a quick answer?</p>
            <p className="mt-1 text-muted">
              The{" "}
              <Link href="/faq" className="link-underline font-medium text-forest-900">
                FAQ
              </Link>{" "}
              covers delivery, returns and account questions.
            </p>
          </div>
        </aside>

        <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-forest-900">
            Send a message
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted">
            All fields marked required must be completed.
          </p>
          <ContactForm />
        </div>
      </div>
      </div>
    </div>
  );
}
