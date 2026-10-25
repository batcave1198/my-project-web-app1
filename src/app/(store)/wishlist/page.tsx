import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StandbyPage } from "@/components/store/standby-page";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const user = await getCurrentUser();

  return (
    <StandbyPage
      eyebrow="Saved items"
      title={user ? "Your wishlist is empty" : "Sign in to save products"}
      description="Wishlists are tied to your account so they follow you between devices. The feature is enabled together with the product catalogue."
      icon={Heart}
    >
      {user ? (
        <Button asChild>
          <Link href="/shop">
            Browse products
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/login?next=%2Fwishlist">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
      )}
    </StandbyPage>
  );
}
