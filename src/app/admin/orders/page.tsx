import type { Metadata } from "next";
import Link from "next/link";
import { Download, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  orderStatusLabels,
  orderStatusStyles,
  ordersExportQuery,
  parseOrderFilters,
  paymentStatusLabels,
  paymentStatusStyles,
} from "@/lib/admin/orders";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatMoneyDecimal } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("/admin/orders");

  const filters = parseOrderFilters(await searchParams);
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: filters.where,
      orderBy: { placedAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        email: true,
        grandTotal: true,
        currency: true,
        status: true,
        paymentStatus: true,
        placedAt: true,
        _count: { select: { items: true } },
      },
    }),
    db.order.count({ where: filters.where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const exportQuery = ordersExportQuery(filters);

  function pageHref(page: number) {
    const search = new URLSearchParams(exportQuery);
    search.set("page", String(page));
    return `/admin/orders?${search.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Sales</p>
          <h1 className="mt-1 text-2xl font-semibold text-forest-900">Orders</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Paid orders appear here as soon as PayHere confirms the payment.
            Review totals, payment status and fulfilment progress.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={`/admin/orders/export${exportQuery ? `?${exportQuery}` : ""}`}>
            <Download className="size-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <div className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-5 py-3 sm:px-6">
          <form className="flex flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Order number, name, email, phone..."
              className="h-9 min-w-56 flex-1 rounded-md border border-line-strong px-3 text-sm"
            />
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="h-9 rounded-md border border-line-strong px-2 text-sm"
            >
              <option value="">All order status</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabels[status]}
                </option>
              ))}
            </select>
            <select
              name="payment"
              defaultValue={filters.payment ?? ""}
              className="h-9 rounded-md border border-line-strong px-2 text-sm"
            >
              <option value="">All payment status</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {paymentStatusLabels[status]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
            {(filters.q || filters.status || filters.payment) && (
              <Link
                href="/admin/orders"
                className="text-xs font-medium text-muted hover:text-forest-900 hover:underline"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShoppingCart className="mx-auto size-8 text-gold-600" />
            <p className="mt-3 text-sm font-medium text-forest-900">
              {total === 0 ? "No orders yet" : "No orders match this filter"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {total === 0
                ? "Orders appear here after checkout. Paid orders are confirmed automatically by PayHere."
                : "Try a different search term or clear the filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                  <th className="px-5 py-2.5 font-semibold sm:px-6">Order</th>
                  <th className="px-4 py-2.5 font-semibold">Customer</th>
                  <th className="px-4 py-2.5 font-semibold">Items</th>
                  <th className="px-4 py-2.5 font-semibold">Payment</th>
                  <th className="px-4 py-2.5 font-semibold">Fulfilment</th>
                  <th className="px-5 py-2.5 text-right font-semibold sm:px-6">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line/70 last:border-0 hover:bg-cream-100/50"
                  >
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-forest-900 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="mt-0.5 block text-xs text-muted">
                        {order.placedAt.toLocaleDateString("en-LK", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="max-w-52 truncate font-medium text-ink-soft">
                        {order.customerName}
                      </p>
                      <p className="max-w-52 truncate text-xs text-muted">
                        {order.email}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {order._count.items}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
                          paymentStatusStyles[order.paymentStatus],
                        )}
                      >
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
                          orderStatusStyles[order.status],
                        )}
                      >
                        {orderStatusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-forest-900 sm:px-6">
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

        {(total > filters.pageSize || filters.page > 1) && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-muted sm:px-6">
            <p>
              Page {filters.page} of {pageCount} · {total} order
              {total === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              {filters.page > 1 ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={pageHref(filters.page - 1)}>Previous</Link>
                </Button>
              ) : null}
              {filters.page < pageCount ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={pageHref(filters.page + 1)}>Next</Link>
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
