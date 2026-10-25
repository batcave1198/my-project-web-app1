import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItems, type CartLine } from "@/components/cart/cart-items";
import { getCart } from "@/lib/cart/get-cart";
import { formatMoneyDecimal } from "@/lib/money";
import { weightLineAmount } from "@/lib/products/weight";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Shopping Cart",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const cart = await getCart();

  const items: CartLine[] = (cart?.items ?? []).map((item) => {
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
      imageUrl: item.product.images[0]?.url ?? null,
      unitPrice: formatMoneyDecimal(unit.toString()),
      lineTotal: formatMoneyDecimal(lineTotal),
      quantity: item.quantity,
      available: item.variant ? item.variant.stock : item.product.stock,
    };
  });

  const subtotal = (cart?.items ?? []).reduce(
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
    <div className="container-page py-12 sm:py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Cart</p>
          <h1 className="mt-1 text-3xl font-semibold text-forest-900">Your cart</h1>
        </div>
        <Link href="/shop" className="hidden text-sm font-medium text-forest-900 hover:underline sm:block">
          Continue shopping
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
        <div>
          <CartItems items={items} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-forest-900">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd>{formatMoneyDecimal(subtotal.toString())}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>Delivery</dt>
                <dd className="text-muted">Calculated at checkout</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-forest-900">
                <dt>Total</dt>
                <dd>{formatMoneyDecimal(subtotal.toString())}</dd>
              </div>
            </dl>

            <Button asChild className="mt-5 w-full" size="lg" disabled={items.length === 0}>
              <Link href="/checkout">
                Checkout
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <ul className="mt-5 space-y-2 text-xs text-muted">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold-600" />
                Card payments are handled by PayHere. We never see your card details.
              </li>
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 size-3.5 shrink-0 text-gold-600" />
                Delivery options and rates are confirmed before payment.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
