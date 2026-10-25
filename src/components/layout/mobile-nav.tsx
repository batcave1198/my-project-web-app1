"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronRight,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  isAuthenticated: boolean;
  isStaff: boolean;
  firstName?: string;
};

export function MobileNav({
  isAuthenticated,
  isStaff,
  firstName,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const accountLinks = [
    ...(isAuthenticated
      ? [
          { label: "My Account", href: "/account", icon: User },
          { label: "My Orders", href: "/account/orders", icon: Package },
          { label: "Wishlist", href: "/wishlist", icon: Heart },
          { label: "Cart", href: "/cart", icon: ShoppingBag },
        ]
      : [
          { label: "Sign In", href: "/login", icon: LogIn },
          { label: "Create Account", href: "/register", icon: User },
        ]),
    ...(isStaff
      ? [{ label: "Admin Dashboard", href: "/admin", icon: Package }]
      : []),
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex size-10 items-center justify-center rounded-md text-forest-900 transition-colors hover:bg-forest-900/6 lg:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-forest-950/45 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,22rem)] flex-col bg-cream-50 shadow-xl outline-none data-[state=open]:animate-fade-in">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title asChild>
              <Logo href={null} />
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex size-10 items-center justify-center rounded-md text-forest-900 hover:bg-forest-900/6"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Site navigation and account links
          </Dialog.Description>

          <nav
            aria-label="Mobile menu"
            onClick={() => setOpen(false)}
            className="flex-1 overflow-y-auto px-3 py-4"
          >
            {isAuthenticated && firstName && (
              <p className="px-3 pb-3 text-sm text-muted">
                Signed in as{" "}
                <span className="font-semibold text-forest-900">
                  {firstName}
                </span>
              </p>
            )}

            <ul className="space-y-0.5">
              {mainNav.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2.5 text-base font-medium transition-colors",
                        active
                          ? "bg-forest-900 text-cream-50"
                          : "text-forest-900 hover:bg-forest-900/6",
                      )}
                    >
                      {item.label}
                      <ChevronRight aria-hidden="true" className="size-4 opacity-60" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="my-4 h-px bg-line" />
            <p className="px-3 pb-1.5 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              Your account
            </p>
            <ul className="space-y-0.5">
              {accountLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-forest-900/6 hover:text-forest-900"
                  >
                    <item.icon aria-hidden="true" className="size-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
              {isAuthenticated && (
                <li>
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                    >
                      <LogOut aria-hidden="true" className="size-4" />
                      Sign Out
                    </button>
                  </form>
                </li>
              )}
            </ul>
          </nav>

          <div className="border-t border-line px-5 py-4">
            <p className="text-xs text-muted">
              Authentic Sri Lankan herbs, spices and natural products.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
