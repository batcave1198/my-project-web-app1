import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Keep the denormalised product rating in sync after review changes. */
export async function refreshProductRating(productId: string) {
  const stats = await db.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const average = stats._avg.rating ?? 0;
  await db.product.update({
    where: { id: productId },
    data: {
      ratingAverage: new Prisma.Decimal(average.toFixed(2)),
      ratingCount: stats._count._all,
    },
  });
}
