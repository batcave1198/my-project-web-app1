"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  User,
  UserRound,
} from "lucide-react";

type AccountMenuProps = {
  name: string;
  email: string;
  isStaff: boolean;
};

const itemClass =
  "flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-2 text-sm text-ink-soft outline-none select-none data-[highlighted]:bg-forest-900/6 data-[highlighted]:text-forest-900";

export function AccountMenu({ name, email, isStaff }: AccountMenuProps) {
  const firstName = name.split(" ")[0] ?? name;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-forest-900 transition-colors hover:bg-forest-900/6"
          aria-label={`Account menu for ${firstName}`}
        >
          <UserRound aria-hidden="true" className="size-[1.15rem]" />
          <span className="hidden xl:inline">{firstName}</span>
          <ChevronDown aria-hidden="true" className="hidden size-3.5 opacity-60 xl:inline" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 rounded-lg border border-line bg-white p-1.5 shadow-lift data-[state=open]:animate-fade-in"
        >
          <DropdownMenu.Label className="px-2.5 py-2">
            <span className="block truncate text-sm font-semibold text-ink">
              {name}
            </span>
            <span className="block truncate text-xs text-muted">{email}</span>
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item asChild>
            <Link href="/account" className={itemClass}>
              <User aria-hidden="true" className="size-4" />
              My Account
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/account/orders" className={itemClass}>
              <Package aria-hidden="true" className="size-4" />
              My Orders
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/wishlist" className={itemClass}>
              <Heart aria-hidden="true" className="size-4" />
              Wishlist
            </Link>
          </DropdownMenu.Item>

          {isStaff && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item asChild>
                <Link href="/admin" className={itemClass}>
                  <LayoutDashboard aria-hidden="true" className="size-4" />
                  Admin Dashboard
                </Link>
              </DropdownMenu.Item>
            </>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item asChild>
            <form action="/api/auth/logout" method="post" className="w-full">
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-danger outline-none select-none data-[highlighted]:bg-danger-soft"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Sign Out
              </button>
            </form>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
