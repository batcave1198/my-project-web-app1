import { assertStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { parseOrderFilters } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const auth = await assertStaff();
  if (!auth.ok) {
    return new Response(auth.status === 401 ? "Unauthorized" : "Forbidden", {
      status: auth.status,
    });
  }

  const url = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) params[key] = value;
  const filters = parseOrderFilters(params);

  const orders = await db.order.findMany({
    where: filters.where,
    orderBy: { placedAt: "desc" },
    take: 20_000,
    include: {
      items: { orderBy: { createdAt: "asc" } },
      payments: {
        where: { status: "SUCCEEDED" },
        orderBy: { verifiedAt: "desc" },
        take: 1,
      },
    },
  });

  const header = [
    "order_number",
    "internal_order_id",
    "placed_at",
    "payment_verified_at",
    "payment_status",
    "order_status",
    "currency",
    "product_id",
    "product_name",
    "variant",
    "sale_mode",
    "quantity",
    "weight_grams",
    "unit_price",
    "price_basis",
    "line_total",
    "subtotal",
    "discount_total",
    "shipping_total",
    "tax_total",
    "grand_total",
    "customer_name",
    "email",
    "phone",
    "shipping_name",
    "shipping_phone",
    "address_line_1",
    "address_line_2",
    "city",
    "district",
    "postal_code",
    "country",
    "shipping_method",
    "courier",
    "tracking_number",
    "tracking_url",
    "customer_note",
    "coupon_code",
  ];

  const lines: string[] = [header.map(csvCell).join(",")];

  for (const order of orders) {
    const paymentVerifiedAt =
      order.payments[0]?.verifiedAt ?? order.confirmedAt ?? null;
    for (const item of order.items) {
      lines.push(
        [
          order.orderNumber,
          order.id,
          order.placedAt.toISOString(),
          paymentVerifiedAt ? paymentVerifiedAt.toISOString() : "",
          order.paymentStatus,
          order.status,
          order.currency,
          item.sku,
          item.productName,
          item.variantLabel,
          item.saleMode,
          item.saleMode === "WEIGHT" ? 1 : item.quantity,
          item.weightGrams ?? "",
          item.unitPrice.toFixed(2),
          item.saleMode === "WEIGHT" ? "per_100g" : "per_unit",
          item.lineTotal.toFixed(2),
          order.subtotal.toFixed(2),
          order.discountTotal.toFixed(2),
          order.shippingTotal.toFixed(2),
          order.taxTotal.toFixed(2),
          order.grandTotal.toFixed(2),
          order.customerName,
          order.email,
          order.phone,
          order.shippingFullName,
          order.shippingPhone,
          order.shippingLine1,
          order.shippingLine2,
          order.shippingCity,
          order.shippingDistrict,
          order.shippingPostalCode,
          order.shippingCountry,
          order.shippingMethodName,
          order.courier,
          order.trackingNumber,
          order.trackingUrl,
          order.customerNote,
          order.couponCode,
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
