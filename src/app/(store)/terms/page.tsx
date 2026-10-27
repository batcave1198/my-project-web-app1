import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using Ceylon Herbs and Spices.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const copy = await getSiteCopy();

  return (
    <PolicyPage
      title={copy.policies.terms.title}
      description={copy.policies.terms.description}
      contactPrompt={copy.policies.terms.contact}
    />
  );
}
