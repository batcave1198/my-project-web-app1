import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description:
    "Delivery information for orders from Ceylon Herbs and Spices.",
  alternates: { canonical: "/shipping" },
};

export default async function ShippingPage() {
  const copy = await getSiteCopy();

  return (
    <PolicyPage
      eyebrow={copy.policies.shipping.eyebrow}
      title={copy.policies.shipping.title}
      description={copy.policies.shipping.description}
      contactPrompt={copy.policies.shipping.contact}
    />
  );
}
