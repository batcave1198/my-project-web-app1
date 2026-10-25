import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const satisfies readonly PaymentStatus[];

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

export const orderStatusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-forest-100 text-forest-800",
  PROCESSING: "bg-forest-100 text-forest-800",
  PACKED: "bg-forest-100 text-forest-800",
  SHIPPED: "bg-cream-300 text-earth-700",
  DELIVERED: "bg-success-soft text-success",
  CANCELLED: "bg-danger-soft text-danger",
  REFUNDED: "bg-danger-soft text-danger",
};

export const paymentStatusStyles: Record<PaymentStatus, string> = {
  UNPAID: "bg-cream-200 text-muted",
  PENDING: "bg-warning-soft text-warning",
  PAID: "bg-success-soft text-success",
  FAILED: "bg-danger-soft text-danger",
  REFUNDED: "bg-danger-soft text-danger",
  PARTIALLY_REFUNDED: "bg-warning-soft text-warning",
};

const PAGE_SIZE = 25;

export type OrderFilters = {
  q: string;
  status?: OrderStatus;
  payment?: PaymentStatus;
  page: number;
  pageSize: number;
  where: Prisma.OrderWhereInput;
};

/**
 * Parses admin order list/search query params. Invalid enum values are ignored
 * rather than throwing, so a stale bookmark still renders a useful page.
 */
export function parseOrderFilters(
  params: Record<string, string | string[] | undefined>,
): OrderFilters {
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const rawPayment = typeof params.payment === "string" ? params.payment : "";
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const status = (ORDER_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as OrderStatus)
    : undefined;
  const payment = (PAYMENT_STATUSES as readonly string[]).includes(rawPayment)
    ? (rawPayment as PaymentStatus)
    : undefined;
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1;

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (payment) where.paymentStatus = payment;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { shippingCity: { contains: q, mode: "insensitive" } },
    ];
  }

  return { q, status, payment, page, pageSize: PAGE_SIZE, where };
}

export function ordersExportQuery(filters: OrderFilters) {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.status) search.set("status", filters.status);
  if (filters.payment) search.set("payment", filters.payment);
  return search.toString();
}
