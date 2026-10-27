import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StandbyPage } from "@/components/store/standby-page";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Deals & Offers",
  description:
    "Current discounts and coupon offers from Ceylon Herbs and Spices.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage() {
  const copy = await getSiteCopy();

  return (
    <StandbyPage
      eyebrow={copy.deals.eyebrow}
      title={copy.deals.title}
      description={copy.deals.body}
      icon={BadgePercent}
    >
      <Button asChild variant="outline">
        <Link href="/categories">{copy.deals.action}</Link>
      </Button>
    </StandbyPage>
  );
}
