import Link from "next/link";
import { Heart, LogIn, Search, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "@/components/layout/account-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { mainNav } from "@/lib/site";
import { getCurrentUser, isStaff } from "@/lib/auth/dal";
import { getCartCount } from "@/lib/cart/get-cart";
import { getStoreSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const [user, settings, cartCount] = await Promise.all([
    getCurrentUser(),
    getStoreSettings(),
    getCartCount(),
  ]);

  const staff = isStaff(user);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-forest-950 text-cream-200">
        <div className="container-page flex h-9 items-center justify-center gap-2 text-center">
          <p className="truncate text-[0.7rem] font-medium tracking-[0.14em] uppercase sm:text-[0.72rem]">
            {settings.announcement ||
              "Sri Lankan herbs, spices & natural products"}
          </p>
        </div>
      </div>

      <div className="border-b border-line bg-cream-50/95 backdrop-blur supports-[backdrop-filter]:bg-cream-50/85">
        <div className="container-page flex h-24 items-center gap-2 lg:gap-6">
          <div className="flex items-center gap-1 lg:hidden">
            <MobileNav
              isAuthenticated={Boolean(user)}
              isStaff={staff}
              firstName={user?.name.split(" ")[0]}
            />
          </div>

          <div className="mr-auto lg:mr-0">
            <Logo />
          </div>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-ink-soft transition-colors hover:text-forest-900",
                      "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:scale-x-0 after:bg-gold-500 after:transition-transform hover:after:scale-x-100",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <Link
              href="/shop"
              aria-label="Search products"
              className="inline-flex size-10 items-center justify-center rounded-md text-forest-900 transition-colors hover:bg-forest-900/6"
            >
              <Search aria-hidden="true" className="size-[1.15rem]" />
            </Link>

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden size-10 items-center justify-center rounded-md text-forest-900 transition-colors hover:bg-forest-900/6 sm:inline-flex"
            >
              <Heart aria-hidden="true" className="size-[1.15rem]" />
            </Link>

            {user ? (
              <AccountMenu
                name={user.name}
                email={user.email}
                isStaff={staff}
              />
            ) : (
              <Link
                href="/login"
                aria-label="Sign in"
                className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-forest-900 transition-colors hover:bg-forest-900/6"
              >
                <LogIn aria-hidden="true" className="size-[1.15rem]" />
                <span className="hidden xl:inline">Sign In</span>
              </Link>
            )}

            <Link
              href="/cart"
              aria-label={
                cartCount > 0
                  ? `Shopping cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`
                  : "Shopping cart"
              }
              className="relative inline-flex size-10 items-center justify-center rounded-md text-forest-900 transition-colors hover:bg-forest-900/6"
            >
              <ShoppingBag aria-hidden="true" className="size-[1.15rem]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-gold-500 px-1 text-[0.6rem] font-bold leading-[1.15rem] text-forest-950">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
