import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderReceipt } from "@/components/checkout/order-receipt";
import { restoreOrderToCart } from "@/lib/actions/checkout";
import { fillCopy, getSiteCopy } from "@/lib/content";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Payment not completed",
  robots: { index: false, follow: false },
};

export default async function CheckoutFailedPage({
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

  if (order.paymentStatus === "PAID") {
    return (
      <div className="container-page max-w-3xl py-12 sm:py-16">
        <h1 className="text-3xl font-semibold text-forest-900">
          {copy.checkout.failed.alreadyPaidTitle}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {fillCopy(copy.checkout.failed.alreadyPaidBody, {
            order: order.orderNumber,
          })}
        </p>
        <Button asChild className="mt-6">
          <Link
            href={`/checkout/success?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`}
          >
            {copy.checkout.failed.viewReceipt}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <div className="flex items-start gap-3">
        <XCircle className="mt-1 size-7 shrink-0 text-danger" />
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">
            {copy.checkout.failed.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {copy.checkout.failed.body}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={restoreOrderToCart}>
          <input type="hidden" name="orderNumber" value={order.orderNumber} />
          <input type="hidden" name="token" value={order.accessToken} />
          <Button type="submit">
            <RotateCcw />
            {copy.checkout.failed.restore}
          </Button>
        </form>
        <Button asChild variant="outline">
          <Link href="/shop">{copy.checkout.failed.continueShopping}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">{copy.checkout.failed.contact}</Link>
        </Button>
      </div>

      <div className="mt-8">
        <OrderReceipt order={order} />
      </div>
    </div>
  );
}
