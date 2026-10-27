import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Ceylon Herbs and Spices handles personal information.",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPolicyPage() {
  const copy = await getSiteCopy();

  return (
    <PolicyPage
      title={copy.policies.privacy.title}
      description={copy.policies.privacy.description}
      contactPrompt={copy.policies.privacy.contact}
    />
  );
}
