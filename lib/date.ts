/**
 * Dates, in the user's own timezone.
 *
 * "This month" must be computed against the user's timezone, not the server's
 * and not UTC. A user in Vancouver logging a coffee at 5pm on 31 January is at
 * 01:00 UTC on 1 February — booking that into February would make the January
 * dashboard disagree with what they remember spending.
 *
 * Calendar is Gregorian throughout; the UI renders Persian month names via the
 * fa-IR locale with an explicit gregory calendar. There is no Jalali support
 * and the brief is explicit that there should not be.
 */
import { TZDate } from "@date-fns/tz";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  isValid,
} from "date-fns";

export const DEFAULT_TIMEZONE = "America/Toronto";

/** A calendar date with no time component, as stored in Postgres `date`. */
export type IsoDate = string; // YYYY-MM-DD

export function resolveTimezone(timezone: string | null | undefined): string {
  if (!timezone) return DEFAULT_TIMEZONE;
  try {
    // Throws RangeError on an unknown zone; a bad value in the profile should
    // degrade to the default rather than blank the dashboard.
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Best-effort guess from the browser, used to prefill onboarding. */
export function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Today's calendar date in the user's timezone, as YYYY-MM-DD. */
export function todayInTimezone(timezone: string, now: Date = new Date()): IsoDate {
  const zoned = new TZDate(now, resolveTimezone(timezone));
  return format(zoned, "yyyy-MM-dd");
}

/**
 * First day of the month containing `reference`, in the user's timezone.
 * Also the value stored in `transactions.posted_month` for recurring
 * idempotency, so its format must stay stable.
 */
export function monthStart(
  timezone: string,
  reference: Date = new Date(),
): IsoDate {
  const zoned = new TZDate(reference, resolveTimezone(timezone));
  return format(startOfMonth(zoned), "yyyy-MM-dd");
}

export function monthEnd(
  timezone: string,
  reference: Date = new Date(),
): IsoDate {
  const zoned = new TZDate(reference, resolveTimezone(timezone));
  return format(endOfMonth(zoned), "yyyy-MM-dd");
}

/** Inclusive [start, end] bounds for a month, for querying transactions. */
export function monthRange(
  timezone: string,
  reference: Date = new Date(),
): { start: IsoDate; end: IsoDate } {
  return {
    start: monthStart(timezone, reference),
    end: monthEnd(timezone, reference),
  };
}

/** The same calendar month, `count` months earlier. */
export function shiftMonths(monthStartIso: IsoDate, count: number): IsoDate {
  const parsed = parseISO(monthStartIso);
  if (!isValid(parsed)) throw new Error(`Invalid month: ${monthStartIso}`);
  return format(startOfMonth(subMonths(parsed, count)), "yyyy-MM-dd");
}

/** The last `count` months, oldest first — the 6-month dashboard chart. */
export function recentMonths(
  timezone: string,
  count: number,
  reference: Date = new Date(),
): IsoDate[] {
  const current = monthStart(timezone, reference);
  return Array.from({ length: count }, (_, i) =>
    shiftMonths(current, count - 1 - i),
  );
}

/* -------------------------------------------------------------------------
   Display formatting. Persian month names, Latin numerals — matching how
   money is rendered, so a row never mixes ۱۲ with 45.50.
------------------------------------------------------------------------- */

const FA_GREGORIAN = "fa-IR-u-ca-gregory-nu-latn";

/** e.g. "12 اوت 2026" */
export function formatDateLong(iso: IsoDate): string {
  return new Intl.DateTimeFormat(FA_GREGORIAN, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISO(iso));
}

/** e.g. "12 اوت" — transaction list day headers, where the year is noise. */
export function formatDateShort(iso: IsoDate): string {
  return new Intl.DateTimeFormat(FA_GREGORIAN, {
    day: "numeric",
    month: "long",
  }).format(parseISO(iso));
}

/** e.g. "اوت 2026" — the dashboard month selector. */
export function formatMonthLabel(iso: IsoDate): string {
  return new Intl.DateTimeFormat(FA_GREGORIAN, {
    month: "long",
    year: "numeric",
  }).format(parseISO(iso));
}

/** Guard for values arriving from AI output or query strings. */
export function isIsoDate(value: unknown): value is IsoDate {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    isValid(parseISO(value))
  );
}
