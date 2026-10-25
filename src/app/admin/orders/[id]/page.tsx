import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { updateOrderStatus, updateOrderTracking } from "@/lib/actions/order";
import {
  ORDER_STATUSES,
  orderStatusLabels,
  orderStatusStyles,
  paymentStatusLabels,
  paymentStatusStyles,
} from "@/lib/admin/orders";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatMoneyDecimal } from "@/lib/money";
import { formatWeight } from "@/lib/products/weight";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details" };

const paymentRecordLabels: Record<string, string> = {
  INITIATED: "Initiated",
  PENDING: "Pending",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  CHARGEDBACK: "Charged back",
};

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireStaff("/admin/orders");
  const { id } = await params;
  const { ok, error } = await searchParams;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-forest-900"
          >
            <ArrowLeft className="size-4" />
            All orders
          </Link>
          <h1 className="mt-3 flex flex-wrap items-center gap-3 text-2xl font-semibold text-forest-900">
            {order.orderNumber}
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                orderStatusStyles[order.status],
              )}
            >
              {orderStatusLabels[order.status]}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                paymentStatusStyles[order.paymentStatus],
              )}
            >
              {paymentStatusLabels[order.paymentStatus]}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed{" "}
            {new Intl.DateTimeFormat("en-LK", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(order.placedAt)}
          </p>
        </div>

        <a
          href={`/admin/orders/export?q=${encodeURIComponent(order.orderNumber)}`}
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-md border border-line-strong px-3 text-sm font-semibold text-ink-soft hover:border-forest-600 hover:text-forest-900"
        >
          Export CSV
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      {ok && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md border border-success/25 bg-success-soft px-4 py-3 text-sm text-success"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {ok}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr] xl:items-start">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-forest-900">
                <Package className="size-4 text-gold-600" />
                Items
              </h2>
              <p className="text-xs text-muted">
                {order.items.reduce(
                  (sum, item) =>
                    sum + (item.saleMode === "WEIGHT" ? 1 : item.quantity),
                  0,
                )}{" "}
                item
                {order.items.reduce(
                  (sum, item) =>
                    sum + (item.saleMode === "WEIGHT" ? 1 : item.quantity),
                  0,
                ) === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                    <th className="px-5 py-2.5 font-semibold">Product</th>
                    <th className="px-4 py-2.5 font-semibold">Product ID</th>
                    <th className="px-4 py-2.5 font-semibold">Qty / weight</th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Price
                    </th>
                    <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-line/70 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-cream-200">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-forest-900">
                              {item.productName}
                            </p>
                            {item.variantLabel && (
                              <p className="text-xs text-muted">
                                {item.variantLabel}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {item.sku || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {item.saleMode === "WEIGHT" && item.weightGrams
                          ? formatWeight(item.weightGrams)
                          : item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-soft">
                        {formatMoneyDecimal(
                          item.unitPrice.toString(),
                          order.currency,
                        )}
                        {item.saleMode === "WEIGHT" && (
                          <span className="block text-xs text-muted">per 100g</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-forest-900">
                        {formatMoneyDecimal(
                          item.lineTotal.toString(),
                          order.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="space-y-2 border-t border-line bg-cream-50/60 px-5 py-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd>
                  {formatMoneyDecimal(
                    order.subtotal.toString(),
                    order.currency,
                  )}
                </dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>
                  Delivery
                  {order.shippingMethodName
                    ? ` · ${order.shippingMethodName}`
                    : ""}
                </dt>
                <dd>
                  {formatMoneyDecimal(
                    order.shippingTotal.toString(),
                    order.currency,
                  )}
                </dd>
              </div>
              {Number(order.discountTotal) > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd>
                    −
                    {formatMoneyDecimal(
                      order.discountTotal.toString(),
                      order.currency,
                    )}
                  </dd>
                </div>
              )}
              {Number(order.taxTotal) > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <dt>Tax</dt>
                  <dd>
                    {formatMoneyDecimal(
                      order.taxTotal.toString(),
                      order.currency,
                    )}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-forest-900">
                <dt>Total</dt>
                <dd>
                  {formatMoneyDecimal(
                    order.grandTotal.toString(),
                    order.currency,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-forest-900">
              <MapPin className="size-4 text-gold-600" />
              Delivery details
            </h2>
            <div className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Customer
                </p>
                <p className="mt-1.5 font-medium text-forest-900">
                  {order.customerName}
                </p>
                <p className="text-ink-soft">{order.email}</p>
                <p className="text-ink-soft">{order.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Ship to
                </p>
                <address className="mt-1.5 leading-relaxed text-ink-soft not-italic">
                  {order.shippingFullName}
                  <br />
                  {order.shippingLine1}
                  {order.shippingLine2 ? (
                    <>
                      <br />
                      {order.shippingLine2}
                    </>
                  ) : null}
                  <br />
                  {order.shippingCity}
                  {order.shippingPostalCode
                    ? ` ${order.shippingPostalCode}`
                    : ""}
                  <br />
                  {order.shippingDistrict}, {order.shippingCountry}
                  <br />
                  {order.shippingPhone}
                </address>
              </div>
            </div>
            {order.customerNote && (
              <div className="mt-5 rounded-md border border-line bg-cream-100/60 px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Customer note
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {order.customerNote}
                </p>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold text-forest-900">Payments</h2>
            </div>
            {order.payments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                No payment records yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {order.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-forest-900">
                        {payment.provider} ·{" "}
                        {paymentRecordLabels[payment.status] ?? payment.status}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted">
                        {payment.providerRef || "No provider reference"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-forest-900">
                        {formatMoneyDecimal(
                          payment.amount.toString(),
                          payment.currency,
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {payment.verifiedAt
                          ? `Verified ${new Intl.DateTimeFormat("en-LK", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(payment.verifiedAt)}`
                          : "Not verified"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold text-forest-900">
              Update status
            </h2>
            <form action={updateOrderStatus} className="mt-4 space-y-4">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <Label htmlFor="status">Fulfilment status</Label>
                <Select
                  id="status"
                  name="status"
                  defaultValue={order.status}
                  className="mt-1.5"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabels[status]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  name="note"
                  rows={2}
                  placeholder="Visible in the order history"
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full">
                Save status
              </Button>
            </form>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-forest-900">
              <Truck className="size-4 text-gold-600" />
              Tracking
            </h2>
            <form action={updateOrderTracking} className="mt-4 space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <Label htmlFor="courier">Courier</Label>
                <Input
                  id="courier"
                  name="courier"
                  defaultValue={order.courier ?? ""}
                  placeholder="e.g. Pronto"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="trackingNumber">Tracking number</Label>
                <Input
                  id="trackingNumber"
                  name="trackingNumber"
                  defaultValue={order.trackingNumber ?? ""}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="trackingUrl">Tracking URL</Label>
                <Input
                  id="trackingUrl"
                  name="trackingUrl"
                  type="url"
                  defaultValue={order.trackingUrl ?? ""}
                  placeholder="https://..."
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" variant="outline" className="w-full">
                Save tracking
              </Button>
            </form>

            {order.trackingNumber && (
              <div className="mt-4 rounded-md border border-line bg-cream-100/60 px-3 py-2.5 text-sm">
                <p className="font-medium text-forest-900">
                  {order.courier || "Courier"}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {order.trackingNumber}
                </p>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-forest-900 hover:underline"
                  >
                    Track shipment
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold text-forest-900">
              Status history
            </h2>
            {order.statusHistory.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No status changes yet.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-forest-900">
                        {orderStatusLabels[entry.status]}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {new Intl.DateTimeFormat("en-LK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(entry.createdAt)}
                      </p>
                      {entry.note && (
                        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
