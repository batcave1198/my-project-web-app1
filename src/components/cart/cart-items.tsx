"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import {
  removeCartItem,
  updateCartItem,
  updateCartItemWeight,
} from "@/lib/actions/cart";
import {
  formatWeight,
  maxWeightGrams,
  MIN_WEIGHT_GRAMS,
  WEIGHT_STEP_GRAMS,
} from "@/lib/products/weight";

export type CartLine = {
  id: string;
  name: string;
  slug: string;
  variantLabel: string | null;
  saleMode: "UNIT" | "WEIGHT";
  weightGrams: number | null;
  imageUrl: string | null;
  unitPrice: string;
  lineTotal: string;
  quantity: number;
  available: number;
};

export function CartItems({
  items,
  empty,
}: {
  items: CartLine[];
  empty: { title: string; body: string; action: string };
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function setQuantity(id: string, quantity: number) {
    if (quantity < 1) return;
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await updateCartItem(id, quantity);
      if (result.status === "error") setError(result.message ?? "Could not update quantity.");
      setBusyId(null);
    });
  }

  function setWeight(id: string, grams: number) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await updateCartItemWeight(id, grams);
      if (result.status === "error") {
        setError(result.message ?? "Could not update weight.");
      }
      setBusyId(null);
    });
  }

  function remove(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await removeCartItem(id);
      if (result.status === "error") setError(result.message ?? "Could not remove item.");
      setBusyId(null);
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong py-16 text-center">
        <p className="text-lg font-medium text-forest-900">{empty.title}</p>
        <p className="mt-1 text-sm text-muted">{empty.body}</p>
        <Link href="/shop" className="link-underline mt-4 inline-block text-sm font-semibold text-forest-900">
          {empty.action}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <ul className="divide-y divide-line rounded-lg border border-line bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 p-4 sm:p-5">
            <Link href={`/shop/${item.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-md bg-cream-200 sm:size-24">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} fill sizes="96px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-muted">No image</span>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/shop/${item.slug}`} className="font-medium text-forest-900 hover:underline">
                    {item.name}
                  </Link>
                  {item.variantLabel && <p className="mt-0.5 text-xs text-muted">{item.variantLabel}</p>}
                  {item.saleMode === "WEIGHT" ? (
                    <>
                      <p className="mt-1 text-sm text-ink-soft">
                        {formatWeight(item.weightGrams ?? 0)} · {item.unitPrice} / 100g
                      </p>
                      {item.weightGrams &&
                        item.weightGrams > maxWeightGrams(item.available) && (
                          <p className="mt-1 text-xs font-medium text-danger">
                            Only {formatWeight(maxWeightGrams(item.available))} left — please reduce the weight.
                          </p>
                        )}
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-ink-soft">{item.unitPrice} each</p>
                      {item.quantity > item.available && (
                        <p className="mt-1 text-xs font-medium text-danger">
                          Only {item.available} left — please reduce the quantity.
                        </p>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={pending && busyId === item.id}
                  aria-label={`Remove ${item.name}`}
                  className="rounded p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                {item.saleMode === "WEIGHT" ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setWeight(
                          item.id,
                          Math.max(
                            MIN_WEIGHT_GRAMS,
                            (item.weightGrams ?? MIN_WEIGHT_GRAMS) - WEIGHT_STEP_GRAMS,
                          ),
                        )
                      }
                      disabled={
                        (item.weightGrams ?? 0) <= MIN_WEIGHT_GRAMS ||
                        (pending && busyId === item.id)
                      }
                      aria-label="Decrease weight"
                      className="inline-flex size-8 items-center justify-center rounded-md border border-line-strong text-forest-900 disabled:opacity-40"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <input
                      key={`${item.id}-${item.weightGrams}`}
                      type="number"
                      min={MIN_WEIGHT_GRAMS}
                      step={WEIGHT_STEP_GRAMS}
                      max={Math.max(maxWeightGrams(item.available), MIN_WEIGHT_GRAMS)}
                      defaultValue={item.weightGrams ?? MIN_WEIGHT_GRAMS}
                      onBlur={(event) => {
                        const next = Number(event.target.value);
                        if (next !== item.weightGrams) setWeight(item.id, next);
                      }}
                      className="h-8 w-24 rounded-md border border-line-strong px-2 text-sm"
                      aria-label={`Weight for ${item.name} in grams`}
                      disabled={pending && busyId === item.id}
                    />
                    <span className="text-xs text-muted">g</span>
                    <button
                      type="button"
                      onClick={() =>
                        setWeight(
                          item.id,
                          Math.min(
                            maxWeightGrams(item.available),
                            (item.weightGrams ?? MIN_WEIGHT_GRAMS) + WEIGHT_STEP_GRAMS,
                          ),
                        )
                      }
                      disabled={
                        (item.weightGrams ?? 0) >=
                          maxWeightGrams(item.available) ||
                        (pending && busyId === item.id)
                      }
                      aria-label="Increase weight"
                      className="inline-flex size-8 items-center justify-center rounded-md border border-line-strong text-forest-900 disabled:opacity-40"
                    >
                      <Plus className="size-3.5" />
                    </button>
                    {pending && busyId === item.id && (
                      <Loader2 className="size-3.5 animate-spin text-muted" />
                    )}
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-md border border-line-strong">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || (pending && busyId === item.id)}
                      aria-label="Decrease quantity"
                      className="inline-flex size-8 items-center justify-center text-forest-900 disabled:opacity-40"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="inline-flex w-9 justify-center text-sm font-medium" aria-live="polite">
                      {pending && busyId === item.id ? <Loader2 className="size-3.5 animate-spin" /> : item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.available || (pending && busyId === item.id)}
                      aria-label="Increase quantity"
                      className="inline-flex size-8 items-center justify-center text-forest-900 disabled:opacity-40"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-sm font-semibold text-forest-900">{item.lineTotal}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
