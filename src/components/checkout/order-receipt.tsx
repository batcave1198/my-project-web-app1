import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { formatMoneyDecimal } from "@/lib/money";
import { formatWeight } from "@/lib/products/weight";

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

const paymentLabels: Record<string, string> = {
  UNPAID: "Awaiting payment",
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function OrderReceipt({ order }: { order: OrderWithItems }) {
  const paid = order.paymentStatus === "PAID";

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-cream-100/60 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Order</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-forest-900">{order.orderNumber}</p>
          <p className="mt-0.5 text-xs text-muted">
            Placed {new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(order.placedAt)}
          </p>
          {order.paymentStatus === "PAID" && order.confirmedAt && (
            <p className="mt-0.5 text-xs text-muted">
              Paid {new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(order.confirmedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              paid ? "bg-success-soft text-success" : "bg-gold-500/15 text-earth-600"
            }`}
          >
            {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
          </span>
          <span className="inline-flex rounded-full bg-forest-900/8 px-2.5 py-1 text-xs font-semibold text-forest-900">
            {statusLabels[order.status] ?? order.status}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-line px-5 sm:px-6">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-3 py-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-200">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-forest-900">{item.productName}</p>
              <p className="text-xs text-muted">
                {item.variantLabel ? `${item.variantLabel} · ` : ""}
                {item.saleMode === "WEIGHT" && item.weightGrams
                  ? `${formatWeight(item.weightGrams)} · ${formatMoneyDecimal(item.unitPrice.toString(), order.currency)} / 100g`
                  : `Qty ${item.quantity}`}
                {item.sku ? ` · ${item.sku}` : ""}
              </p>
            </div>
            <p className="text-sm text-forest-900">{formatMoneyDecimal(item.lineTotal.toString(), order.currency)}</p>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-line bg-cream-50/60 px-5 py-4 text-sm sm:px-6">
        <div className="flex justify-between text-ink-soft">
          <dt>Subtotal</dt>
          <dd>{formatMoneyDecimal(order.subtotal.toString(), order.currency)}</dd>
        </div>
        <div className="flex justify-between text-ink-soft">
          <dt>Delivery{order.shippingMethodName ? ` · ${order.shippingMethodName}` : ""}</dt>
          <dd>{formatMoneyDecimal(order.shippingTotal.toString(), order.currency)}</dd>
        </div>
        {Number(order.discountTotal) > 0 && (
          <div className="flex justify-between text-success">
            <dt>Discount</dt>
            <dd>−{formatMoneyDecimal(order.discountTotal.toString(), order.currency)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-forest-900">
          <dt>Total</dt>
          <dd>{formatMoneyDecimal(order.grandTotal.toString(), order.currency)}</dd>
        </div>
      </dl>

      <div className="grid gap-4 border-t border-line px-5 py-4 text-sm sm:grid-cols-2 sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Delivery to</p>
          <address className="mt-1.5 leading-relaxed text-ink-soft not-italic">
            {order.shippingFullName}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 ? <><br />{order.shippingLine2}</> : null}
            <br />
            {order.shippingCity}
            {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
            <br />
            {order.shippingDistrict}, {order.shippingCountry}
            <br />
            {order.shippingPhone}
          </address>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Contact</p>
          <p className="mt-1.5 leading-relaxed text-ink-soft">{order.customerName}</p>
          <p className="text-ink-soft">{order.email}</p>
          {order.customerNote && (
            <>
              <p className="mt-3 text-xs font-semibold tracking-[0.12em] text-muted uppercase">Note</p>
              <p className="mt-1 text-sm text-ink-soft">{order.customerNote}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
