import Link from "next/link";
import { FileClock } from "lucide-react";

/**
 * Legal and policy pages are intentionally not filled with invented terms.
 * Until the business has reviewed and approved real policy copy, each page
 * states clearly that the policy is pending. Admin editing arrives in Phase 7.
 */
export function PolicyPage({
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
          This policy is being finalised
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The full text is reviewed and approved by the business before it is
          published. Nothing on this page is a substitute for that review, and no
          legal terms are invented here.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {contactPrompt ??
            "If you need an answer now, contact us and we will help directly."}
        </p>
        <Link
          href="/contact"
          className="link-underline mt-5 inline-flex text-sm font-semibold text-forest-900"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
