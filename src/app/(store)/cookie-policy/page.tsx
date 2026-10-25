import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Ceylon Herbs and Spices uses cookies.",
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <PolicyPage
      title="Cookie Policy"
      description="The store uses a small number of essential cookies for sign-in and cart session handling. A full cookie policy is being prepared."
      contactPrompt="If you have a question about cookies or tracking, contact us and we will explain exactly what is used."
    />
  );
}
