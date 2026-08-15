/**
 * The only sanctioned path for converting, summing and formatting money.
 *
 * Every amount in this app is an integer count of the currency's minor unit
 * (cents). $45.50 is 4550, never 45.5. Floats are not used at any point: the
 * classic 0.1 + 0.2 = 0.30000000000000004 is a rounding error in a toy, and a
 * wrong balance in a finance app.
 *
 * Nothing outside this module may format an amount for display or do
 * arithmetic on one. `money.test.ts` pins the behaviour that makes that safe.
 */

export const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "CAD";

/** Every currency we support happens to have 2 decimal places. */
const MINOR_UNIT_DIGITS = 2;
const MINOR_UNITS_PER_MAJOR = 100;

export function isCurrency(value: unknown): value is Currency {
  return (
    typeof value === "string" && (CURRENCIES as readonly string[]).includes(value)
  );
}

/**
 * Persian (۰-۹) and Arabic-Indic (٠-٩) digits to Latin, plus the Persian/Arabic
 * decimal separator and thousands mark.
 *
 * Users type on Persian keyboards. Without this, "۴۵٫۵" is rejected as invalid
 * and the manual-entry form fails the 10-second test for the people the app is
 * actually for.
 */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 0x30),
    )
    .replace(/[٠-٩]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30),
    )
    .replace(/[٫٬]/g, (d) => (d === "٫" ? "." : ","));
}

/**
 * Parse user input into minor units. Returns null rather than throwing so
 * form validation can present a Persian error message.
 *
 * Accepts "45.50", "۴۵٫۵", "1,234.56", " 45 ", "$45.50".
 * Rejects "", "abc", "-5", "45.999" (more precision than the currency has).
 */
export function parseAmountToMinor(input: string | number): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return roundToMinor(input);
  }

  const cleaned = normalizeDigits(input)
    .trim()
    // Strip currency symbols, spaces (incl. the Persian thousands space) and
    // grouping commas. Anything else left over makes it invalid.
    .replace(/[\s,٬$€£]/g, "")
    .replace(/^\+/, "");

  if (cleaned === "") return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;

  const [, fraction = ""] = cleaned.split(".") as [string, string?];
  // Silently rounding 45.999 to 46.00 would be us inventing money. Reject it.
  if (fraction.length > MINOR_UNIT_DIGITS) return null;

  const asNumber = Number(cleaned);
  if (!Number.isFinite(asNumber)) return null;

  return roundToMinor(asNumber);
}

/**
 * Strict variant for trusted callers (AI output already validated by Zod,
 * database rows). Throws so a bug surfaces loudly instead of silently
 * writing a zero.
 */
export function toMinor(input: string | number): number {
  const parsed = parseAmountToMinor(input);
  if (parsed === null) {
    throw new Error(`Not a valid money amount: ${JSON.stringify(input)}`);
  }
  return parsed;
}

function roundToMinor(major: number): number {
  // Scale before rounding: Math.round(45.505 * 100) is exact here, whereas
  // toFixed on the major unit inherits the float error we are avoiding.
  return Math.round(major * MINOR_UNITS_PER_MAJOR);
}

export function toMajor(minor: number): number {
  assertMinor(minor);
  return minor / MINOR_UNITS_PER_MAJOR;
}

export function assertMinor(minor: number): void {
  if (!Number.isInteger(minor)) {
    throw new Error(
      `Money must be an integer count of minor units, got ${minor}. ` +
        `Amounts are cents — did something divide by 100 too early?`,
    );
  }
}

export function sumMinor(values: readonly number[]): number {
  let total = 0;
  for (const value of values) {
    assertMinor(value);
    total += value;
  }
  return total;
}

/**
 * Savings rate as a fraction of income, clamped to [-1, 1] for display.
 * Returns null when there is no income — "∞% saved" is not a useful thing to
 * show someone, and 0/0 is not 0.
 */
export function savingsRate(
  incomeMinor: number,
  expenseMinor: number,
): number | null {
  assertMinor(incomeMinor);
  assertMinor(expenseMinor);
  if (incomeMinor <= 0) return null;
  return (incomeMinor - expenseMinor) / incomeMinor;
}

/**
 * Percentage change against a previous period. Null when the previous period
 * had no activity, for the same reason as above.
 */
export function percentChange(
  currentMinor: number,
  previousMinor: number,
): number | null {
  assertMinor(currentMinor);
  assertMinor(previousMinor);
  if (previousMinor === 0) return null;
  return (currentMinor - previousMinor) / Math.abs(previousMinor);
}

/**
 * Format for display. Always Latin digits with grouping separators — the brief
 * requires this, and it is also what the users themselves read amounts in.
 *
 * Note this returns a bare string. Rendering it inside Persian text without
 * direction isolation puts the currency symbol on the wrong side; the <Money />
 * component wraps this with dir="ltr" + unicode-bidi: isolate so no call site
 * has to remember.
 */
export function formatMoney(
  minor: number,
  currency: Currency = DEFAULT_CURRENCY,
  options: { signDisplay?: "auto" | "always" | "never" } = {},
): string {
  assertMinor(minor);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: MINOR_UNIT_DIGITS,
    maximumFractionDigits: MINOR_UNIT_DIGITS,
    signDisplay: options.signDisplay ?? "auto",
  }).format(toMajor(minor));
}

/** Compact form for chart axes, where "$1,234,567.00" will not fit. */
export function formatMoneyCompact(
  minor: number,
  currency: Currency = DEFAULT_CURRENCY,
): string {
  assertMinor(minor);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toMajor(minor));
}

/** e.g. 0.184 -> "18%". Latin digits, matching the money figures. */
export function formatPercent(fraction: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(fraction);
}
