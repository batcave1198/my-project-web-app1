import "server-only";
import type { Prisma } from "@prisma/client";
import { getEnv } from "@/lib/env";
import { sendEmail, escapeHtml } from "@/lib/email/mail";
import { formatMoneyDecimal } from "@/lib/money";
import { siteConfig } from "@/lib/site";

type PaidOrder = Prisma.OrderGetPayload<{ include: { items: true } }>;

function itemLabel(item: PaidOrder["items"][number]) {
  const variant = item.variantLabel ? ` · ${item.variantLabel}` : "";
  if (item.saleMode === "WEIGHT") {
    return `${item.productName}${variant} · ${item.weightGrams ?? 0}g`;
  }
  return `${item.productName}${variant} · ×${item.quantity}`;
}

export async function sendOrderConfirmationEmail(order: PaidOrder) {
  if (!order.email) return false;

  const base = getEnv().APP_URL.replace(/\/+$/, "");
  const orderUrl = `${base}/checkout/success?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`;
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #ece7db;font-size:14px;line-height:1.5;">${escapeHtml(itemLabel(item))}</td>
        <td style="padding:10px 0;border-bottom:1px solid #ece7db;font-size:14px;text-align:right;white-space:nowrap;">${escapeHtml(formatMoneyDecimal(String(item.lineTotal), order.currency))}</td>
      </tr>`,
    )
    .join("");

  const textLines = order.items
    .map(
      (item) =>
        `${itemLabel(item)} — ${formatMoneyDecimal(String(item.lineTotal), order.currency)}`,
    )
    .join("\n");

  const text = `Hi ${order.customerName},\n\nPayment for order ${order.orderNumber} has been confirmed.\n\n${textLines}\n\nTotal: ${formatMoneyDecimal(String(order.grandTotal), order.currency)}\n\nView your order: ${orderUrl}\n\nThank you for shopping with ${siteConfig.name}.`;

  return sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed — ${siteConfig.name}`,
    text,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f6f1e6;font-family:Arial,Helvetica,sans-serif;color:#20332a;">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #e6dfcf;border-radius:12px;padding:28px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7a7466;">${escapeHtml(siteConfig.name)}</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#173c2b;">Payment confirmed</h1>
        <p style="margin:0 0 6px;font-size:15px;line-height:1.7;">Hi ${escapeHtml(order.customerName)},</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">We have received payment for order <strong>${escapeHtml(order.orderNumber)}</strong>. We will let you know when it ships.</p>

        <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:12px 0 0;font-size:16px;font-weight:bold;text-align:right;">Total: ${escapeHtml(formatMoneyDecimal(String(order.grandTotal), order.currency))}</p>

        <p style="margin:24px 0;"><a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#173c2b;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 20px;border-radius:8px;">View order</a></p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#7a7466;">Shipping to: ${escapeHtml(order.shippingFullName)}, ${escapeHtml(order.shippingLine1)}${order.shippingLine2 ? `, ${escapeHtml(order.shippingLine2)}` : ""}, ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingDistrict)}.</p>
      </div>
    </div>
  </body>
</html>`,
  });
}
