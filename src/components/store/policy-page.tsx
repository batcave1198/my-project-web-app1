import Link from "next/link";
import { FileClock } from "lucide-react";
import { getSiteCopy } from "@/lib/content";

/**
 * Legal and policy pages are intentionally not filled with invented terms.
 * Until the business has reviewed and approved real policy copy, each page
 * states clearly that the policy is pending. The surrounding copy comes from
 * content/site-copy.yaml.
 */
export async function PolicyPage({
  eyebrow = "Legal",
  title,
  description,
  contactPrompt,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  contactPrompt?: string;
}) {
  const copy = await getSiteCopy();

  return (
    <div className="container-narrow py-14 sm:py-18">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">{description}</p>

      <div className="mt-8 rounded-lg border border-line bg-white p-6 sm:p-8">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-cream-200">
          <FileClock aria-hidden="true" className="size-5 text-earth-600" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-forest-900">
          {copy.policies.pendingTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {copy.policies.pendingBody}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {contactPrompt ?? copy.policies.pendingContact}
        </p>
        <Link
          href="/contact"
          className="link-underline mt-5 inline-flex text-sm font-semibold text-forest-900"
        >
          {copy.policies.contactCta}
        </Link>
      </div>
    </div>
  );
}
