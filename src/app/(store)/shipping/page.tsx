import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description:
    "Delivery information for orders from Ceylon Herbs and Spices.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <PolicyPage
      eyebrow="Help"
      title="Shipping & Delivery"
      description="Delivery zones, charges and estimated timeframes are set in the admin dashboard and shown at checkout before an order is placed."
      contactPrompt="If you need a delivery estimate for a specific district before ordering, contact us with your location."
    />
  );
}
