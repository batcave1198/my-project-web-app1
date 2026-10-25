import { fromMinor, toMinor } from "@/lib/money";

/**
 * Weight products are priced from a single admin-entered price per 100g.
 * All calculations use integer cents so the customer-facing line total is
 * always rounded consistently.
 */
export const WEIGHT_PRESETS = [100, 250, 500, 1000] as const;
export const MIN_WEIGHT_GRAMS = 50;
export const WEIGHT_STEP_GRAMS = 10;

export type SaleMode = "UNIT" | "WEIGHT";

export function formatWeight(grams: number): string {
  if (!Number.isFinite(grams) || grams < 0) return "—";
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg.toFixed(kg % 1 === 0 ? 0 : 2).replace(/\.?0+$/, "")} kg`;
  }
  return `${Math.round(grams)} g`;
}

export function weightLineMinor(
  pricePer100g: string | number,
  grams: number,
): number {
  return Math.round((toMinor(pricePer100g) * grams) / 100);
}

export function weightLineAmount(
  pricePer100g: string | number,
  grams: number,
): string {
  return fromMinor(weightLineMinor(pricePer100g, grams));
}

export function isValidWeightGrams(grams: number, availableGrams = Infinity) {
  return (
    Number.isInteger(grams) &&
    grams >= MIN_WEIGHT_GRAMS &&
    grams % WEIGHT_STEP_GRAMS === 0 &&
    grams <= availableGrams
  );
}

export function maxWeightGrams(availableGrams: number) {
  if (!Number.isFinite(availableGrams)) return Infinity;
  if (availableGrams < MIN_WEIGHT_GRAMS) return 0;
  return (
    Math.floor(availableGrams / WEIGHT_STEP_GRAMS) * WEIGHT_STEP_GRAMS
  );
}

export function clampWeightGrams(grams: number, availableGrams: number) {
  const max = maxWeightGrams(availableGrams);
  if (max < MIN_WEIGHT_GRAMS) return MIN_WEIGHT_GRAMS;
  if (!Number.isFinite(grams)) return MIN_WEIGHT_GRAMS;
  const rounded = Math.round(grams / WEIGHT_STEP_GRAMS) * WEIGHT_STEP_GRAMS;
  return Math.min(Math.max(MIN_WEIGHT_GRAMS, rounded), max);
}

export function isWeightMode(value: string | null | undefined): value is "WEIGHT" {
  return value === "WEIGHT";
}
