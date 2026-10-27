import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description:
    "Returns and refunds information for orders from Ceylon Herbs and Spices.",
  alternates: { canonical: "/returns" },
};

export default async function ReturnsPage() {
  const copy = await getSiteCopy();

  return (
    <PolicyPage
      eyebrow={copy.policies.returns.eyebrow}
      title={copy.policies.returns.title}
      description={copy.policies.returns.description}
      contactPrompt={copy.policies.returns.contact}
    />
  );
}
