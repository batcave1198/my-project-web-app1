import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { sendOrderConfirmationEmail } from "@/lib/email/order";
import { payHereNotifyHash, safeCompare } from "@/lib/payhere";

/**
 * PayHere server-to-server notification.
 *
 * Rules:
 *  - Never trust the browser return URL for payment state.
 *  - Verify the md5 signature before touching an order.
 *  - Be idempotent: PayHere may retry the same notification.
 *  - Respond 200 for anything we have processed so it stops retrying.
 */
export async function POST(request: Request) {
  const env = getEnv();

  if (!env.PAYHERE_MERCHANT_ID || !env.PAYHERE_MERCHANT_SECRET) {
    return new Response("PayHere is not configured", { status: 503 });
  }

  const form = await request.formData();
  const merchantId = String(form.get("merchant_id") ?? "");
  const orderNumber = String(form.get("order_id") ?? "");
  const paymentId = String(form.get("payment_id") ?? "");
  const amount = String(form.get("payhere_amount") ?? "");
  const currency = String(form.get("payhere_currency") ?? "");
  const statusCode = String(form.get("status_code") ?? "");
  const md5sig = String(form.get("md5sig") ?? "");

  if (!merchantId || !orderNumber || !amount || !currency || !statusCode || !md5sig) {
    return new Response("Missing fields", { status: 400 });
  }

  if (merchantId !== env.PAYHERE_MERCHANT_ID) {
    return new Response("Merchant mismatch", { status: 400 });
  }

  const expected = payHereNotifyHash(
    merchantId,
    orderNumber,
    amount,
    currency,
    statusCode,
    env.PAYHERE_MERCHANT_SECRET,
  );

  if (!safeCompare(expected, md5sig.toUpperCase())) {
    console.warn("[payhere] invalid signature", { orderNumber });
    return new Response("Invalid signature", { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!order) {
    return new Response("Unknown order", { status: 404 });
  }

  const paidAmount = Number(amount);
  const expectedAmount = Number(order.grandTotal);
  if (currency !== order.currency || Math.abs(paidAmount - expectedAmount) > 0.01) {
    console.warn("[payhere] amount mismatch", { orderNumber, amount, expected: expectedAmount });
    return new Response("Amount mismatch", { status: 400 });
  }

  const payment = order.payments[0];

  if (statusCode === "2") {
    // Success. Guard with a conditional update so a duplicate callback cannot
    // decrement stock twice.
    const result = await db.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "PAID" } },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      if (claimed.count === 0) {
        // Already processed — keep the payment record tidy and stop.
        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              providerRef: paymentId || payment.providerRef,
              status: "SUCCEEDED",
              verifiedAt: payment.verifiedAt ?? new Date(),
            },
          });
        }
        return { claimed: false };
      }

      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            providerRef: paymentId || payment.providerRef,
            status: "SUCCEEDED",
            verifiedAt: new Date(),
            rawPayload: Object.fromEntries(form.entries()) as Record<string, string>,
          },
        });
      }

      for (const item of order.items) {
        if (item.saleMode === "WEIGHT") {
          const grams = item.weightGrams ?? 0;
          if (!item.productId || grams <= 0) {
            console.error("[payhere] invalid weight line", { orderNumber, itemId: item.id });
            continue;
          }

          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: grams } },
            data: {
              stock: { decrement: grams },
              // One customer purchase, regardless of the selected weight.
              salesCount: { increment: 1 },
            },
          });
          if (updated.count === 0) {
            console.error("[payhere] oversold weight product", {
              orderNumber,
              productId: item.productId,
              grams,
            });
          } else {
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                variantId: null,
                type: "PURCHASE",
                quantity: -grams,
                referenceType: "ORDER",
                referenceId: order.id,
                note: `Order ${orderNumber} · ${grams}g`,
              },
            });
          }
          continue;
        }

        if (item.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            console.error("[payhere] oversold variant", { orderNumber, variantId: item.variantId });
          }
        }
        if (item.productId) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
          });
          if (updated.count === 0) {
            console.error("[payhere] oversold product", { orderNumber, productId: item.productId });
          } else {
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                variantId: item.variantId,
                type: "PURCHASE",
                quantity: -item.quantity,
                referenceType: "ORDER",
                referenceId: order.id,
                note: `Order ${orderNumber}`,
              },
            });
          }
        }
      }

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "CONFIRMED", note: "Payment confirmed by PayHere." },
      });

      return { claimed: true };
    });

    if (result.claimed) {
      after(async () => {
        await sendOrderConfirmationEmail(order).catch((error) => {
          console.error("[email] order confirmation failed", error);
        });
      });
    }

    return new Response("OK", { status: 200 });
  }

  // Non-success states. Mark the payment record but never touch stock.
  const failed = statusCode === "-1" || statusCode === "-2" || statusCode === "-3";
  const cancelled = statusCode === "-1";

  await db.$transaction(async (tx) => {
    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          providerRef: paymentId || payment.providerRef,
          status: cancelled ? "CANCELLED" : failed ? "FAILED" : "PENDING",
          failureReason: String(form.get("status_message") ?? "").slice(0, 500) || null,
          rawPayload: Object.fromEntries(form.entries()) as Record<string, string>,
          verifiedAt: new Date(),
        },
      });
    }

    if (order.paymentStatus !== "PAID") {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: failed ? "FAILED" : "PENDING",
          status: cancelled ? "CANCELLED" : order.status,
          cancelledAt: cancelled ? new Date() : order.cancelledAt,
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: cancelled ? "CANCELLED" : order.status,
          note: `PayHere status ${statusCode}: ${String(form.get("status_message") ?? "no message")}`.slice(0, 500),
        },
      });
    }
  });

  return new Response("OK", { status: 200 });
}
