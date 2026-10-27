import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderReceipt } from "@/components/checkout/order-receipt";
import { PaymentPoller } from "@/components/checkout/payment-poller";
import { fillCopy, getSiteCopy } from "@/lib/content";
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

  const copy = await getSiteCopy();
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
            <h1 className="text-3xl font-semibold text-forest-900">
              {copy.checkout.success.paidTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {fillCopy(copy.checkout.success.paidBody, { email: order.email })}
            </p>
          </div>
        </div>
      ) : failed || cancelled ? (
        <div className="flex items-start gap-3">
          <XCircle className="mt-1 size-7 shrink-0 text-danger" />
          <div>
            <h1 className="text-3xl font-semibold text-forest-900">
              {copy.checkout.success.failedTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {cancelled
                ? copy.checkout.success.cancelledBody
                : copy.checkout.success.failedBody}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/shop">{copy.checkout.success.backToShop}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/checkout/failed?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`}>
                  {copy.checkout.success.orderDetails}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Clock className="mt-1 size-7 shrink-0 text-gold-600" />
          <div>
            <h1 className="text-3xl font-semibold text-forest-900">
              {copy.checkout.success.pendingTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {copy.checkout.success.pendingBody}
            </p>
            <p className="mt-2 text-xs text-muted">
              {fillCopy(copy.checkout.success.pendingNote, {
                order: order.orderNumber,
              })}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <OrderReceipt order={order} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/shop">{copy.checkout.success.continueShopping}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">{copy.checkout.success.help}</Link>
        </Button>
      </div>
    </div>
  );
}
