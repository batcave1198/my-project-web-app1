import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description:
    "Returns and refunds information for orders from Ceylon Herbs and Spices.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Help"
      title="Returns & Refunds"
      description="The returns window, eligibility conditions and refund process are being reviewed and will be published here in full."
      contactPrompt="If something is wrong with an order you have received, contact us with the order number so we can help."
    />
  );
}
