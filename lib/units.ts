export type Unit = "crore" | "usd-billion";

export const UNIT_OPTIONS: Array<{ value: Unit; label: string }> = [
  { value: "crore", label: "₹ crore" },
  { value: "usd-billion", label: "$ billion" },
];

/**
 * CDSL/NSE report values are stored in INR crore.
 * 1 crore = 10 million; 1 USD billion = usdInr × 100 crore.
 */
export function convertFromCrore(
  valueInCrore: number,
  unit: Unit,
  usdInr: number | null,
): number {
  if (unit === "crore") return valueInCrore;
  if (!usdInr) return Number.NaN;
  return valueInCrore / (usdInr * 100);
}

export function formatNumber(value: number, unit: Unit, maxDecimals = 2) {
  const locale = unit === "usd-billion" ? "en-US" : "en-IN";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

export function formatFlow(
  valueInCrore: number,
  unit: Unit,
  usdInr: number | null,
  maxDecimals = 2,
): string {
  const value = convertFromCrore(valueInCrore, unit, usdInr);

  if (Number.isNaN(value)) return "—";

  const sign = value < 0 ? "−" : "";

  if (unit === "usd-billion") {
    return `${sign}$${formatNumber(Math.abs(value), unit, maxDecimals)} bn`;
  }

  return `${sign}₹${formatNumber(Math.abs(value), unit, maxDecimals)} cr`;
}
