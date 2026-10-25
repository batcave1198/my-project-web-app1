import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import {
  AdminSidebar,
  AdminSidebarMobile,
} from "@/components/admin/admin-sidebar";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin — Ceylon Herbs",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff("/admin");

  return (
    <div className="flex min-h-dvh bg-cream-100/50">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-cream-50/95 backdrop-blur">
          <div className="flex h-24 items-center gap-3 px-4 sm:px-6">
            <AdminSidebarMobile />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-forest-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted">
                {user.role === "ADMIN" ? "Administrator" : "Staff"}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-forest-900/6 hover:text-forest-900 sm:text-sm"
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                <span className="hidden sm:inline">Storefront</span>
              </Link>

              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-danger/40 hover:bg-danger-soft hover:text-danger sm:text-sm"
                >
                  <LogOut aria-hidden="true" className="size-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
