import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Ceylon Herbs and Spices handles personal information.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      description="How we collect, use and protect personal information is being documented and reviewed before publication."
      contactPrompt="For a privacy question about your account or an order, contact us and we will respond directly."
    />
  );
}
