import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StandbyPage } from "@/components/store/standby-page";

export const metadata: Metadata = {
  title: "Deals & Offers",
  description:
    "Current discounts and coupon offers from Ceylon Herbs and Spices.",
  alternates: { canonical: "/deals" },
};

export default function DealsPage() {
  return (
    <StandbyPage
      eyebrow="Offers"
      title="Offers appear here when they are live"
      description="Store-wide discounts and coupon codes are created in the admin dashboard with start and end dates. Nothing is advertised unless it is genuinely active."
      icon={BadgePercent}
    >
      <Button asChild variant="outline">
        <Link href="/categories">Browse categories</Link>
      </Button>
    </StandbyPage>
  );
}
