import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Ceylon Herbs and Spices uses cookies.",
  alternates: { canonical: "/cookie-policy" },
};

export default async function CookiePolicyPage() {
  const copy = await getSiteCopy();

  return (
    <PolicyPage
      title={copy.policies.cookie.title}
      description={copy.policies.cookie.description}
      contactPrompt={copy.policies.cookie.contact}
    />
  );
}
