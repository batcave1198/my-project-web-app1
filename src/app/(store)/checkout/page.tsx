import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { CheckoutForm, type CheckoutLine, type CheckoutMethod, type CheckoutZone } from "@/components/checkout/checkout-form";
import { getCart } from "@/lib/cart/get-cart";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSiteCopy } from "@/lib/content";
import { db } from "@/lib/db";
import { formatMoneyDecimal } from "@/lib/money";
import { weightLineAmount } from "@/lib/products/weight";
import { isPayHereConfigured } from "@/lib/payhere";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [cart, copy] = await Promise.all([getCart(), getSiteCopy()]);
  if (!cart || cart.items.length === 0) redirect("/cart");

  const [user, zones] = await Promise.all([
    getCurrentUser(),
    db.shippingZone.findMany({
      where: { isActive: true, methods: { some: { isActive: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        methods: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
        },
      },
    }),
  ]);

  const defaultAddress = user
    ? await db.address.findFirst({
        where: { userId: user.id, isDefaultShipping: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const checkoutZones: CheckoutZone[] = zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    districts: zone.districts,
  }));

  const methods: CheckoutMethod[] = zones.flatMap((zone) =>
    zone.methods.map((method) => ({
      id: method.id,
      zoneId: zone.id,
      zoneName: zone.name,
      name: method.name,
      description: method.description,
      price: formatMoneyDecimal(method.price.toString()),
      priceValue: method.price.toString(),
      freeOver: method.freeOverAmount
        ? formatMoneyDecimal(method.freeOverAmount.toString())
        : null,
      freeOverValue: method.freeOverAmount ? method.freeOverAmount.toString() : null,
      minDays: method.minDays,
      maxDays: method.maxDays,
    })),
  );

  const items: CheckoutLine[] = cart.items.map((item) => {
    const unit = item.variant ? item.variant.price : item.product.price;
    const lineTotal =
      item.saleMode === "WEIGHT" && item.weightGrams
        ? weightLineAmount(unit.toString(), item.weightGrams)
        : unit.mul(item.quantity).toString();
    return {
      id: item.id,
      name: item.product.name,
      slug: item.product.slug,
      variantLabel: item.variant?.label ?? null,
      saleMode: item.saleMode,
      weightGrams: item.weightGrams,
      quantity: item.quantity,
      lineTotal: formatMoneyDecimal(lineTotal),
      imageUrl: item.product.images[0]?.url ?? null,
    };
  });

  const subtotal = cart.items.reduce(
    (sum, item) => {
      const unit = item.variant ? item.variant.price : item.product.price;
      if (item.saleMode === "WEIGHT" && item.weightGrams) {
        return sum.add(weightLineAmount(unit.toString(), item.weightGrams));
      }
      return sum.add(unit.mul(item.quantity));
    },
    new Prisma.Decimal(0),
  );

  return (
    <div className="container-page py-10 sm:py-14">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-forest-900"
      >
        <ArrowLeft className="size-4" />
        {copy.checkout.back}
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{copy.checkout.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-semibold text-forest-900">{copy.checkout.title}</h1>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <LockKeyhole className="size-3.5 text-gold-600" />
          {copy.checkout.paymentNote}
        </p>
      </div>

      <div className="mt-8">
        <CheckoutForm
          zones={checkoutZones}
          methods={methods}
          items={items}
          subtotal={formatMoneyDecimal(subtotal.toString())}
          subtotalValue={subtotal.toString()}
          paymentsConfigured={isPayHereConfigured()}
          defaults={{
            fullName: defaultAddress?.fullName ?? user?.name ?? "",
            email: user?.email ?? "",
            phone: defaultAddress?.phone ?? user?.phone ?? "",
            line1: defaultAddress?.line1 ?? "",
            line2: defaultAddress?.line2 ?? "",
            city: defaultAddress?.city ?? "",
            district: defaultAddress?.district ?? "",
            postalCode: defaultAddress?.postalCode ?? "",
          }}
        />
      </div>
    </div>
  );
}
