"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addToCart,
  buyNow,
  type CartActionState,
} from "@/lib/actions/cart";
import { formatMoneyDecimal } from "@/lib/money";
import {
  clampWeightGrams,
  formatWeight,
  isValidWeightGrams,
  maxWeightGrams,
  MIN_WEIGHT_GRAMS,
  WEIGHT_PRESETS,
  WEIGHT_STEP_GRAMS,
  weightLineAmount,
} from "@/lib/products/weight";

export type PurchaseVariant = {
  id: string;
  label: string;
  price: string;
  compareAt: string | null;
  stock: number;
  sku: string | null;
};

type Props = {
  productId: string;
  sku: string;
  saleMode: "UNIT" | "WEIGHT";
  basePrice: string;
  basePriceValue: string;
  baseCompareAt: string | null;
  baseCompareAtValue: string | null;
  baseStock: number;
  variants: PurchaseVariant[];
};

export function ProductPurchasePanel({
  productId,
  sku,
  saleMode,
  basePrice,
  basePriceValue,
  baseCompareAt,
  baseCompareAtValue,
  baseStock,
  variants,
}: Props) {
  const router = useRouter();
  const isWeight = saleMode === "WEIGHT";
  const [variantId, setVariantId] = useState<string | null>(
    () => variants.find((variant) => variant.stock > 0)?.id ?? variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [weightGrams, setWeightGrams] = useState(() =>
    clampWeightGrams(100, baseStock),
  );
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"add" | "buy" | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const variant = variants.find((item) => item.id === variantId) ?? null;
  const price = isWeight
    ? formatMoneyDecimal(weightLineAmount(basePriceValue, weightGrams))
    : variant
      ? variant.price
      : basePrice;
  const compareAtValue = isWeight
    ? baseCompareAtValue
      ? formatMoneyDecimal(weightLineAmount(baseCompareAtValue, weightGrams))
      : null
    : variant
      ? variant.compareAt
      : baseCompareAt;
  const stock = isWeight
    ? baseStock
    : variant
      ? variant.stock
      : baseStock;
  const currentSku = !isWeight && variant ? (variant.sku ?? sku) : sku;
  const maxWeight = maxWeightGrams(stock);
  const inStock = isWeight ? maxWeight >= MIN_WEIGHT_GRAMS : stock > 0;
  const maxQuantity = Math.min(Math.max(stock, 1), 50);
  const weightValid =
    isValidWeightGrams(weightGrams, stock) && weightGrams > 0;

  function handleAdd() {
    setMessage(null);
    if (isWeight && !weightValid) {
      setMessage({
        tone: "error",
        text: `Choose a weight from ${MIN_WEIGHT_GRAMS}g to ${formatWeight(maxWeight)}, in ${WEIGHT_STEP_GRAMS}g steps.`,
      });
      return;
    }
    setPendingAction("add");
    startTransition(async () => {
      const result: CartActionState = await addToCart(
        productId,
        isWeight ? null : variantId,
        isWeight ? 1 : quantity,
        isWeight ? weightGrams : undefined,
      );
      setPendingAction(null);
      if (result.status === "error") {
        setMessage({ tone: "error", text: result.message ?? "Could not add this to your cart." });
        return;
      }
      setMessage({ tone: "success", text: "Added to your cart." });
      router.refresh();
    });
  }

  function handleBuyNow() {
    setMessage(null);
    if (isWeight && !weightValid) {
      setMessage({
        tone: "error",
        text: `Choose a weight from ${MIN_WEIGHT_GRAMS}g to ${formatWeight(maxWeight)}, in ${WEIGHT_STEP_GRAMS}g steps.`,
      });
      return;
    }
    setPendingAction("buy");
    startTransition(async () => {
      const result = await buyNow(
        productId,
        isWeight ? null : variantId,
        isWeight ? 1 : quantity,
        isWeight ? weightGrams : undefined,
      );
      if (result?.status === "error") {
        setPendingAction(null);
        setMessage({ tone: "error", text: result.message ?? "Could not start checkout." });
      }
    });
  }

  function chooseWeight(grams: number) {
    setWeightGrams(clampWeightGrams(grams, stock));
    setMessage(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-semibold text-forest-900">{price}</span>
          {compareAtValue && (
            <span className="text-lg text-muted line-through">{compareAtValue}</span>
          )}
          {compareAtValue && (
            <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
              Sale
            </span>
          )}
        </div>
        {isWeight ? (
          <p className="mt-2 text-sm text-muted">
            {formatWeight(weightGrams)} selected · {basePrice} per 100g
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">Product ID: {currentSku}</p>
      </div>

      {!isWeight && variants.length > 0 && (
        <div>
          <p className="text-sm font-medium text-forest-900">Size / Variant</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((item) => {
              const selected = item.id === variantId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setVariantId(item.id);
                    setQuantity(1);
                    setMessage(null);
                  }}
                  aria-pressed={selected}
                  className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                    selected
                      ? "border-forest-800 bg-forest-900 text-cream-50"
                      : "border-line-strong text-forest-900 hover:border-forest-600"
                  } ${item.stock === 0 ? "opacity-50" : ""}`}
                >
                  {item.label} — {item.price}
                  {item.stock === 0 ? " (out of stock)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isWeight && (
        <div>
          <p className="text-sm font-medium text-forest-900">Choose weight</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEIGHT_PRESETS.map((grams) => {
              const disabled = grams > maxWeight;
              const selected = weightGrams === grams;
              return (
                <button
                  key={grams}
                  type="button"
                  onClick={() => chooseWeight(grams)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                    selected
                      ? "border-forest-800 bg-forest-900 text-cream-50"
                      : "border-line-strong text-forest-900 hover:border-forest-600"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {formatWeight(grams)}
                </button>
              );
            })}
          </div>
          <label className="mt-3 block text-sm font-medium text-forest-900" htmlFor="customWeight">
            Custom weight
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="customWeight"
              type="number"
              min={MIN_WEIGHT_GRAMS}
              step={WEIGHT_STEP_GRAMS}
              max={Math.max(maxWeight, MIN_WEIGHT_GRAMS)}
              value={weightGrams}
              onChange={(event) => chooseWeight(Number(event.target.value))}
              className="h-11 w-32 rounded-md border border-line-strong bg-white px-3 text-sm"
            />
            <span className="text-sm text-muted">grams</span>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Minimum {MIN_WEIGHT_GRAMS}g · {WEIGHT_STEP_GRAMS}g steps
          </p>
        </div>
      )}

      <p className={`text-sm ${inStock ? "text-success" : "text-danger"}`}>
        {inStock
          ? isWeight
            ? `In stock (${formatWeight(maxWeight)} available)`
            : `In stock (${stock} available)`
          : "Out of stock"}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {!isWeight && (
          <div className="inline-flex items-center rounded-md border border-line-strong bg-white">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1 || !inStock}
              aria-label="Decrease quantity"
              className="inline-flex size-11 items-center justify-center text-forest-900 disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="inline-flex w-10 justify-center text-sm font-semibold" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
              disabled={quantity >= maxQuantity || !inStock}
              aria-label="Increase quantity"
              className="inline-flex size-11 items-center justify-center text-forest-900 disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleAdd}
          disabled={!inStock || pending || (isWeight && !weightValid)}
          className="flex-1 sm:flex-none"
        >
          {pending && pendingAction === "add" ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
          Add to cart
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={handleBuyNow}
          disabled={!inStock || pending || (isWeight && !weightValid)}
          className="flex-1 sm:flex-none"
        >
          {pending && pendingAction === "buy" ? <Loader2 className="animate-spin" /> : <Zap />}
          Buy now
        </Button>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-md px-3 py-2 text-sm ${
            message.tone === "success"
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
