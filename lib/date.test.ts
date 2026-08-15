import { describe, it, expect } from "vitest";
import {
  todayInTimezone,
  monthStart,
  monthEnd,
  monthRange,
  shiftMonths,
  recentMonths,
  resolveTimezone,
  isIsoDate,
  formatMonthLabel,
} from "./date";

describe("resolveTimezone", () => {
  it("falls back to the default for a missing or bogus zone", () => {
    expect(resolveTimezone(null)).toBe("America/Toronto");
    expect(resolveTimezone("")).toBe("America/Toronto");
    expect(resolveTimezone("Not/AZone")).toBe("America/Toronto");
  });

  it("passes through a valid zone", () => {
    expect(resolveTimezone("Europe/Berlin")).toBe("Europe/Berlin");
  });
});

describe("todayInTimezone", () => {
  it("uses the user's local calendar date, not UTC", () => {
    // 1 Feb 2026 01:00 UTC is still 31 Jan in Vancouver. Booking this into
    // February would make the January dashboard disagree with the user.
    const instant = new Date("2026-02-01T01:00:00Z");
    expect(todayInTimezone("America/Vancouver", instant)).toBe("2026-01-31");
    expect(todayInTimezone("UTC", instant)).toBe("2026-02-01");
  });

  it("handles the other direction across the date line", () => {
    // 31 Jan 2026 20:00 UTC is already 1 Feb in Sydney.
    const instant = new Date("2026-01-31T20:00:00Z");
    expect(todayInTimezone("Australia/Sydney", instant)).toBe("2026-02-01");
  });
});

describe("monthStart / monthEnd", () => {
  it("brackets the month in the user's timezone", () => {
    const instant = new Date("2026-08-15T12:00:00Z");
    expect(monthStart("America/Toronto", instant)).toBe("2026-08-01");
    expect(monthEnd("America/Toronto", instant)).toBe("2026-08-31");
  });

  it("gets February right in a non-leap year", () => {
    const instant = new Date("2026-02-10T12:00:00Z");
    expect(monthEnd("UTC", instant)).toBe("2026-02-28");
  });

  it("gets February right in a leap year", () => {
    const instant = new Date("2028-02-10T12:00:00Z");
    expect(monthEnd("UTC", instant)).toBe("2028-02-29");
  });

  it("assigns a late-night transaction to the month the user was in", () => {
    const instant = new Date("2026-09-01T02:00:00Z"); // 31 Aug 22:00 Toronto
    expect(monthStart("America/Toronto", instant)).toBe("2026-08-01");
  });
});

describe("monthRange", () => {
  it("returns inclusive bounds", () => {
    const instant = new Date("2026-08-15T12:00:00Z");
    expect(monthRange("UTC", instant)).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
    });
  });
});

describe("shiftMonths", () => {
  it("steps back within a year", () => {
    expect(shiftMonths("2026-08-01", 1)).toBe("2026-07-01");
  });

  it("steps back across a year boundary", () => {
    expect(shiftMonths("2026-01-01", 1)).toBe("2025-12-01");
  });

  it("does not overflow from the 31st into the wrong month", () => {
    // date-fns clamps 31 March minus one month to 28/29 February; we then take
    // the month start, so the result must still be 1 February.
    expect(shiftMonths("2026-03-01", 1)).toBe("2026-02-01");
  });

  it("rejects a malformed month", () => {
    expect(() => shiftMonths("not-a-date", 1)).toThrow(/Invalid month/);
  });
});

describe("recentMonths", () => {
  it("returns N months oldest-first, ending with the current one", () => {
    const instant = new Date("2026-08-15T12:00:00Z");
    expect(recentMonths("UTC", 6, instant)).toEqual([
      "2026-03-01",
      "2026-04-01",
      "2026-05-01",
      "2026-06-01",
      "2026-07-01",
      "2026-08-01",
    ]);
  });
});

describe("isIsoDate", () => {
  it("accepts YYYY-MM-DD", () => {
    expect(isIsoDate("2026-08-15")).toBe(true);
  });

  it("rejects other shapes and impossible dates", () => {
    expect(isIsoDate("2026-8-5")).toBe(false);
    expect(isIsoDate("15/08/2026")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate(20260815)).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
});

describe("formatMonthLabel", () => {
  it("renders Persian month names with Latin numerals", () => {
    const label = formatMonthLabel("2026-08-01");
    // Latin year, no Persian digits — money and dates must not mix numeral
    // systems on the same row.
    expect(label).toMatch(/2026/);
    expect(label).not.toMatch(/[۰-۹]/);
  });
});
