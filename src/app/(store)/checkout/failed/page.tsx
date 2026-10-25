import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderReceipt } from "@/components/checkout/order-receipt";
import { restoreOrderToCart } from "@/lib/actions/checkout";
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

  if (order.paymentStatus === "PAID") {
    return (
      <div className="container-page max-w-3xl py-12 sm:py-16">
        <h1 className="text-3xl font-semibold text-forest-900">This order is already paid</h1>
        <p className="mt-2 text-sm text-muted">
          Payment for {order.orderNumber} has been confirmed. You can view the receipt on the
          confirmation page.
        </p>
        <Button asChild className="mt-6">
          <Link
            href={`/checkout/success?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`}
          >
            View receipt
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
          <h1 className="text-3xl font-semibold text-forest-900">Your payment was not completed</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The order below has not been paid, so it has not been confirmed. Nothing has been
            charged. You can put the same items back into your cart and try again, or choose a
            different payment attempt from checkout.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={restoreOrderToCart}>
          <input type="hidden" name="orderNumber" value={order.orderNumber} />
          <input type="hidden" name="token" value={order.accessToken} />
          <Button type="submit">
            <RotateCcw />
            Return items to cart
          </Button>
        </form>
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>

      <div className="mt-8">
        <OrderReceipt order={order} />
      </div>
    </div>
  );
}
