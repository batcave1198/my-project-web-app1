import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StandbyPage } from "@/components/store/standby-page";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const [user, copy] = await Promise.all([getCurrentUser(), getSiteCopy()]);

  return (
    <StandbyPage
      eyebrow={copy.wishlist.eyebrow}
      title={
        user ? copy.wishlist.signedInTitle : copy.wishlist.signedOutTitle
      }
      description={copy.wishlist.body}
      icon={Heart}
    >
      {user ? (
        <Button asChild>
          <Link href="/shop">
            {copy.wishlist.browse}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/login?next=%2Fwishlist">{copy.wishlist.signIn}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">{copy.wishlist.register}</Link>
          </Button>
        </div>
      )}
    </StandbyPage>
  );
}
