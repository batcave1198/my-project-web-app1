"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BadgePercent,
  ChevronRight,
  FileText,
  Images,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  ScrollText,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  exact?: boolean;
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/products/import", label: "Bulk Import", icon: Upload },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/shipping", label: "Shipping", icon: Truck },
      { href: "/admin/discounts", label: "Discounts", icon: BadgePercent },
    ],
  },
  {
    title: "People",
    items: [{ href: "/admin/customers", label: "Customers", icon: Users }],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/content", label: "Pages & FAQ", icon: FileText },
      { href: "/admin/gallery", label: "Gallery", icon: Images },
      { href: "/admin/contact-messages", label: "Messages", icon: Mail },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

const allNavItems = navGroups.flatMap((group) => group.items);

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function activeHref(pathname: string) {
  let best: NavItem | null = null;
  for (const item of allNavItems) {
    if (!isActive(pathname, item)) continue;
    if (!best || item.href.length > best.href.length) best = item;
  }
  return best?.href ?? null;
}

function SidebarBody({ pathname }: { pathname: string }) {
  const current = activeHref(pathname);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-24 shrink-0 items-center border-b border-cream-100/10 px-5">
        <Logo tone="light" />
      </div>

      <div className="flex items-center gap-2 px-5 pt-5 pb-2">
        <span className="rounded bg-gold-500/15 px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.16em] text-gold-300 uppercase">
          Admin
        </span>
      </div>

      <nav
        aria-label="Admin sections"
        className="admin-sidebar-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 pt-3 pb-8"
      >
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-2.5 pb-1.5 text-[0.6rem] font-semibold tracking-[0.18em] text-cream-200/40 uppercase">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = current === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-cream-50 text-forest-950"
                          : "text-cream-200/75 hover:bg-cream-100/8 hover:text-cream-50",
                      )}
                    >
                      <item.icon
                        aria-hidden={true}
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-forest-800" : "text-gold-400/80",
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-cream-100/10 px-4 py-4">
        <Link
          href="/"
          className="flex items-center justify-between rounded-md px-2 py-2 text-xs font-medium text-cream-200/60 transition-colors hover:bg-cream-100/8 hover:text-cream-50"
        >
          View storefront
          <ChevronRight aria-hidden={true} className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebarMobile() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open admin menu"
          className="inline-flex size-10 items-center justify-center rounded-md text-forest-900 transition-colors hover:bg-forest-900/6 lg:hidden"
        >
          <Menu aria-hidden={true} className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-forest-950/50 data-[state=open]:animate-fade-in lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(88vw,19rem)] overflow-hidden bg-forest-950 shadow-xl outline-none data-[state=open]:animate-fade-in lg:hidden">
          <Dialog.Title className="sr-only">Admin navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Links to every section of the admin dashboard
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close admin menu"
              className="absolute top-4 right-3 z-10 inline-flex size-9 items-center justify-center rounded-md text-cream-200/70 hover:bg-cream-100/10 hover:text-cream-50"
            >
              <X aria-hidden={true} className="size-5" />
            </button>
          </Dialog.Close>
          <div onClick={() => setOpen(false)}>
            <SidebarBody pathname={pathname} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 bg-forest-950 lg:block">
      <div className="sticky top-0 h-dvh">
        <SidebarBody pathname={pathname} />
      </div>
    </aside>
  );
}
