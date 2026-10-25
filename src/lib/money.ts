/**
 * Money helpers.
 *
 * Every price in the database is stored as Decimal(12,2) in the store currency
 * (USD). All arithmetic happens in integer minor units (cents) so a rounding
 * error can never reach a customer's invoice. Never use floating point for
 * money.
 */

export const STORE_CURRENCY = "USD" as const;

export type Minor = number & { readonly __brand: "minor-units" };

export function toMinor(value: string | number): Minor {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Invalid amount: ${value}`);
    return Math.round(value * 100) as Minor;
  }

  const trimmed = value.trim().replace(/,/g, "");
  const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(trimmed);
  if (!match) throw new Error(`Invalid amount: ${value}`);

  const [, sign, whole = "", fraction = ""] = match;
  const cents = Number.parseInt((fraction + "00").slice(0, 2), 10);
  const minor = Number.parseInt(whole || "0", 10) * 100 + cents;

  return (sign ? -minor : minor) as Minor;
}

export function fromMinor(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(minor));
  const whole = Math.floor(absolute / 100);
  const cents = absolute % 100;
  return `${sign}${whole}.${cents.toString().padStart(2, "0")}`;
}

/** `$1,250.00` — the format used across the storefront and invoices. */
export function formatMoney(minor: number, currency: string = STORE_CURRENCY): string {
  const absolute = Math.abs(Math.round(minor));
  const formatted = new Intl.NumberFormat(
    currency === "LKR" ? "en-LK" : "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(absolute / 100);

  const symbol =
    currency === "USD"
      ? "$"
      : currency === "LKR"
        ? "Rs "
        : currency === "EUR"
          ? "€"
          : currency === "GBP"
            ? "£"
            : `${currency} `;
  return `${minor < 0 ? "-" : ""}${symbol}${formatted}`;
}

export function formatMoneyDecimal(
  value: string | number,
  currency: string = STORE_CURRENCY,
) {
  return formatMoney(toMinor(value), currency);
}

/** Percentage of an amount, rounded half-up to the nearest cent. */
export function percentOf(minor: number, percent: number): number {
  return Math.round((minor * percent) / 100);
}

export function clampDiscount(minor: number, maxMinor?: number | null): number {
  if (maxMinor == null) return minor;
  return Math.min(minor, maxMinor);
}
