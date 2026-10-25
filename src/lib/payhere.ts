import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

export const PAYHERE_SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
export const PAYHERE_LIVE_URL = "https://www.payhere.lk/pay/checkout";

export function isPayHereConfigured() {
  const env = getEnv();
  return Boolean(env.PAYHERE_MERCHANT_ID && env.PAYHERE_MERCHANT_SECRET);
}

function md5Upper(value: string) {
  return createHash("md5").update(value).digest("hex").toUpperCase();
}

/** Signature required on the outgoing checkout form. */
export function payHereCheckoutHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string,
) {
  return md5Upper(
    `${merchantId}${orderId}${amount}${currency}${md5Upper(merchantSecret)}`,
  );
}

/** Signature PayHere sends with its server-to-server notification. */
export function payHereNotifyHash(
  merchantId: string,
  orderId: string,
  payhereAmount: string,
  payhereCurrency: string,
  statusCode: string,
  merchantSecret: string,
) {
  return md5Upper(
    `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${md5Upper(merchantSecret)}`,
  );
}

export function safeCompare(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Builds the fields for the auto-submitting POST form. `amount` must be a
 * two-decimal string — PayHere includes it verbatim in the signature.
 */
export function buildPayHereCheckout(input: {
  orderNumber: string;
  amount: string;
  currency: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const env = getEnv();
  if (!isPayHereConfigured()) {
    throw new Error("PayHere is not configured");
  }

  const merchantId = env.PAYHERE_MERCHANT_ID!;
  const merchantSecret = env.PAYHERE_MERCHANT_SECRET!;
  const notifyUrl =
    env.PAYHERE_NOTIFY_URL || `${env.APP_URL}/api/payments/payhere/notify`;

  return {
    action:
      env.PAYHERE_MODE === "live" ? PAYHERE_LIVE_URL : PAYHERE_SANDBOX_URL,
    fields: {
      merchant_id: merchantId,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      notify_url: notifyUrl,
      order_id: input.orderNumber,
      items: "Ceylon Herbs and Spices order",
      currency: input.currency,
      amount: input.amount,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      country: "Sri Lanka",
      hash: payHereCheckoutHash(
        merchantId,
        input.orderNumber,
        input.amount,
        input.currency,
        merchantSecret,
      ),
    },
  };
}
