import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  CircleAlert,
  Mail,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { getDashboardData } from "@/lib/admin/dashboard";
import { formatMoneyDecimal } from "@/lib/money";
import { formatWeight } from "@/lib/products/weight";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const orderStatusStyles: Record<string, string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-forest-100 text-forest-800",
  PROCESSING: "bg-forest-100 text-forest-800",
  PACKED: "bg-forest-100 text-forest-800",
  SHIPPED: "bg-cream-300 text-earth-700",
  DELIVERED: "bg-success-soft text-success",
  CANCELLED: "bg-danger-soft text-danger",
  REFUNDED: "bg-danger-soft text-danger",
};

const orderStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function AdminDashboardPage() {
  const {
    productCount,
    publishedCount,
    draftCount,
    orderCount,
    openOrderCount,
    customerCount,
    newMessageCount,
    pendingReviewCount,
    revenue,
    recentOrders,
    lowStock,
  } = await getDashboardData();

  const revenueTotal = formatMoneyDecimal(revenue);

  const stats = [
    {
      label: "Products",
      value: String(productCount),
      hint: `${publishedCount} published · ${draftCount} draft`,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Orders",
      value: String(orderCount),
      hint: `${openOrderCount} awaiting completion`,
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      label: "Customers",
      value: String(customerCount),
      hint: "Registered accounts",
      icon: Users,
      href: "/admin/customers",
    },
    {
      label: "Revenue · 30 days",
      value: revenueTotal,
      hint: "Paid orders only",
      icon: TrendingUp,
      href: "/admin/orders",
    },
  ];

  const attention = [
    {
      label: "Orders awaiting completion",
      count: openOrderCount,
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      label: "Reviews awaiting moderation",
      count: pendingReviewCount,
      href: "/admin/reviews",
      icon: Star,
    },
    {
      label: "Unread contact messages",
      count: newMessageCount,
      href: "/admin/contact-messages",
      icon: Mail,
    },
  ];

  const nothingToDo = attention.every((item) => item.count === 0);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div>
        <p className="eyebrow">Overview</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-forest-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          A live snapshot of the store. Every number below comes straight from
          the database.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-lg border border-line bg-white p-5 transition-colors hover:border-gold-500/50"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {stat.label}
              </p>
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-forest-900/6">
                <stat.icon aria-hidden="true" className="size-4 text-forest-800" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl leading-none text-forest-900">
              {stat.value}
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted">
              {stat.hint}
              <ArrowRight
                aria-hidden="true"
                className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <section
          aria-labelledby="recent-orders-heading"
          className="rounded-lg border border-line bg-white xl:col-span-2"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2
              id="recent-orders-heading"
              className="text-base font-semibold text-forest-900"
            >
              Recent orders
            </h2>
            <Link
              href="/admin/orders"
              className="link-underline text-xs font-semibold text-forest-900"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <ShoppingCart
                aria-hidden="true"
                className="mx-auto size-8 text-gold-600"
              />
              <p className="mt-3 text-sm font-medium text-forest-900">
                No orders yet
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
                Orders placed through the storefront will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Order
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-line/70 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <span className="block font-semibold text-forest-900">
                          {order.orderNumber}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {order.placedAt.toLocaleDateString("en-LK", {
                            dateStyle: "medium",
                          })}
                        </span>
                      </td>
                      <td className="max-w-[11rem] truncate px-3 py-3 text-ink-soft">
                        {order.customerName}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
                            orderStatusStyles[order.status] ??
                              "bg-cream-200 text-earth-700",
                          )}
                        >
                          {orderStatusLabels[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-forest-900">
                        {formatMoneyDecimal(
                          order.grandTotal.toString(),
                          order.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section
            aria-labelledby="attention-heading"
            className="rounded-lg border border-line bg-white"
          >
            <div className="border-b border-line px-5 py-4">
              <h2
                id="attention-heading"
                className="text-base font-semibold text-forest-900"
              >
                Needs attention
              </h2>
            </div>

            {nothingToDo ? (
              <div className="px-5 py-8 text-center">
                <CircleAlert
                  aria-hidden="true"
                  className="mx-auto size-7 text-success"
                />
                <p className="mt-2 text-sm font-medium text-forest-900">
                  Everything is clear
                </p>
                <p className="mt-1 text-xs text-muted">
                  No orders, reviews or messages are waiting.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {attention.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-cream-100/60"
                    >
                      <item.icon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-earth-500"
                      />
                      <span className="min-w-0 flex-1 text-sm text-ink-soft">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "inline-flex min-w-6 justify-center rounded-full px-1.5 py-0.5 text-xs font-bold",
                          item.count > 0
                            ? "bg-warning-soft text-warning"
                            : "bg-cream-200 text-muted",
                        )}
                      >
                        {item.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="low-stock-heading"
            className="rounded-lg border border-line bg-white"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2
                id="low-stock-heading"
                className="text-base font-semibold text-forest-900"
              >
                Low stock
              </h2>
              <Link
                href="/admin/products"
                className="link-underline text-xs font-semibold text-forest-900"
              >
                Manage
              </Link>
            </div>

            {lowStock.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <BadgePercent
                  aria-hidden="true"
                  className="mx-auto size-7 text-gold-600"
                />
                <p className="mt-2 text-sm font-medium text-forest-900">
                  Stock levels look healthy
                </p>
                <p className="mt-1 text-xs text-muted">
                  Published products at or below their alert threshold appear
                  here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {lowStock.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                      {product.name}
                    </span>
                    <span className="rounded bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">
                      {product.saleMode === "WEIGHT"
                        ? `${formatWeight(product.stock)} left`
                        : `${product.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
