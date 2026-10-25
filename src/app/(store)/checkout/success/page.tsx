import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderReceipt } from "@/components/checkout/order-receipt";
import { PaymentPoller } from "@/components/checkout/payment-poller";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order: orderNumber, token } = await searchParams;

  if (!orderNumber || !token) notFound();

  const order = await db.order.findFirst({
    where: { orderNumber, accessToken: token },
    include: { items: true },
  });

  if (!order) notFound();

  const paid = order.paymentStatus === "PAID";
  const failed = order.paymentStatus === "FAILED";
  const cancelled = order.status === "CANCELLED";

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <PaymentPoller active={!paid && !failed && !cancelled} />

      {paid ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 size-7 shrink-0 text-success" />
          <div>
            <h1 className="text-3xl font-semibold text-forest-900">Thank you — payment received</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your order is confirmed. We have emailed a copy of this receipt to {order.email} and
              will let you know as it moves through packing and delivery.
            </p>
          </div>
        </div>
      ) : failed || cancelled ? (
        <div className="flex items-start gap-3">
          <XCircle className="mt-1 size-7 shrink-0 text-danger" />
          <div>
            <h1 className="text-3xl font-semibold text-forest-900">Payment did not complete</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {cancelled
                ? "This order was cancelled before payment was confirmed."
                : "PayHere reported that the payment failed. No money has been taken for this order."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/shop">Back to the shop</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/checkout/failed?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`}>
                  Order details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Clock className="mt-1 size-7 shrink-0 text-gold-600" />
          <div>
            <h1 className="text-3xl font-semibold text-forest-900">Confirming your payment</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              PayHere has returned you to our store. We are waiting for the server-side payment
              notification before confirming the order. This page refreshes automatically — it
              usually takes a few seconds.
            </p>
            <p className="mt-2 text-xs text-muted">
              Keep this page open. If it stays on this message, contact us with order number{" "}
              <span className="font-mono text-forest-900">{order.orderNumber}</span>.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <OrderReceipt order={order} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">Need help with this order?</Link>
        </Button>
      </div>
    </div>
  );
}
