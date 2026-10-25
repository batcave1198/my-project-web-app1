import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using Ceylon Herbs and Spices.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      description="The terms that govern accounts, orders, payments and delivery are being prepared with the business and will be published here in full."
      contactPrompt="If you need clarity on any term before placing an order, contact us and we will answer directly."
    />
  );
}
