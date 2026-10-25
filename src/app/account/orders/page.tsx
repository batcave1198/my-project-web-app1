import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatMoneyDecimal } from "@/lib/money";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};

const statusLabel: Record<string, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { placedAt: "desc" },
    take: 50,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      grandTotal: true,
      currency: true,
      placedAt: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="container-page py-12 sm:py-16">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-line-strong bg-white/60 px-6 py-16 text-center">
          <PackageOpen aria-hidden="true" className="mx-auto size-9 text-gold-600" />
          <h2 className="mt-4 text-xl font-semibold text-forest-900">
            No orders yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Orders placed with this account will appear here with their full
            status history.
          </p>
          <Button asChild className="mt-6">
            <Link href="/shop">Browse products</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-4 rounded-lg border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-forest-900">
                  {order.orderNumber}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {order.placedAt.toLocaleDateString("en-LK", {
                    dateStyle: "medium",
                  })}{" "}
                  · {order._count.items}{" "}
                  {order._count.items === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <span className="rounded-full bg-cream-200 px-3 py-1 text-xs font-semibold text-earth-700">
                  {statusLabel[order.status] ?? order.status}
                </span>
                <span className="font-semibold text-forest-900">
                  {formatMoneyDecimal(order.grandTotal.toString(), order.currency)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
