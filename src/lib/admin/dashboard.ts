import "server-only";
import { db } from "@/lib/db";

/**
 * All dashboard queries live here so the page component stays pure. Keeping
 * `new Date()` out of render also keeps React's purity lint happy and makes the
 * data fetch reusable for a future dashboard API.
 */
export async function getDashboardData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    productCount,
    publishedCount,
    draftCount,
    orderCount,
    openOrderCount,
    customerCount,
    newMessageCount,
    pendingReviewCount,
    revenue,
    recentOrders,
    lowStock,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "PUBLISHED" } }),
    db.product.count({ where: { status: "DRAFT" } }),
    db.order.count(),
    db.order.count({
      where: {
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"] },
      },
    }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.order.aggregate({
      _sum: { grandTotal: true },
      where: { paymentStatus: "PAID", placedAt: { gte: thirtyDaysAgo } },
    }),
    db.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        paymentStatus: true,
        grandTotal: true,
        currency: true,
        placedAt: true,
      },
    }),
    db.$queryRaw<
      Array<{
        id: string;
        name: string;
        stock: number;
        lowStockAlert: number;
        saleMode: "UNIT" | "WEIGHT";
      }>
    >`
      SELECT "id", "name", "stock", "lowStockAlert", "saleMode"
      FROM "Product"
      WHERE "status" = 'PUBLISHED' AND "stock" <= "lowStockAlert"
      ORDER BY "stock" ASC, "name" ASC
      LIMIT 5
    `,
  ]);

  return {
    productCount,
    publishedCount,
    draftCount,
    orderCount,
    openOrderCount,
    customerCount,
    newMessageCount,
    pendingReviewCount,
    revenue: revenue._sum.grandTotal?.toString() ?? "0",
    recentOrders,
    lowStock,
  };
}
