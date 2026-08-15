import { describe, it, expect } from "vitest";
import {
  parseAmountToMinor,
  toMinor,
  toMajor,
  sumMinor,
  savingsRate,
  percentChange,
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  normalizeDigits,
  assertMinor,
  isCurrency,
} from "./money";

describe("normalizeDigits", () => {
  it("converts Persian digits to Latin", () => {
    expect(normalizeDigits("۴۵")).toBe("45");
    expect(normalizeDigits("۱۲۳۴۵۶۷۸۹۰")).toBe("1234567890");
  });

  it("converts Arabic-Indic digits to Latin", () => {
    expect(normalizeDigits("٤٥")).toBe("45");
  });

  it("converts the Persian decimal separator to a dot", () => {
    expect(normalizeDigits("۴۵٫۵۰")).toBe("45.50");
  });

  it("leaves Latin input untouched", () => {
    expect(normalizeDigits("45.50")).toBe("45.50");
  });
});

describe("parseAmountToMinor", () => {
  it("parses plain decimals into cents", () => {
    expect(parseAmountToMinor("45.50")).toBe(4550);
    expect(parseAmountToMinor("0.01")).toBe(1);
    expect(parseAmountToMinor("100")).toBe(10000);
  });

  it("parses Persian-keyboard input", () => {
    expect(parseAmountToMinor("۴۵٫۵۰")).toBe(4550);
    expect(parseAmountToMinor("۱۲")).toBe(1200);
  });

  it("tolerates grouping separators, spaces and currency symbols", () => {
    expect(parseAmountToMinor("1,234.56")).toBe(123456);
    expect(parseAmountToMinor("  45.50  ")).toBe(4550);
    expect(parseAmountToMinor("$45.50")).toBe(4550);
  });

  it("rejects junk rather than guessing", () => {
    expect(parseAmountToMinor("")).toBeNull();
    expect(parseAmountToMinor("abc")).toBeNull();
    expect(parseAmountToMinor("4.5.6")).toBeNull();
    expect(parseAmountToMinor("-5")).toBeNull();
  });

  it("rejects more precision than the currency has, instead of inventing money", () => {
    expect(parseAmountToMinor("45.999")).toBeNull();
  });

  it("does not accumulate float error", () => {
    // 0.1 + 0.2 in floats is 0.30000000000000004. In cents it is exactly 30.
    const total = sumMinor([
      parseAmountToMinor("0.1")!,
      parseAmountToMinor("0.2")!,
    ]);
    expect(total).toBe(30);
    expect(formatMoney(total)).toBe("$0.30");
  });

  it("rounds the classic float-scaling case correctly", () => {
    expect(parseAmountToMinor("1.005")).toBeNull(); // too precise, rejected
    expect(parseAmountToMinor(19.99)).toBe(1999);
    expect(parseAmountToMinor(0.29)).toBe(29);
  });
});

describe("toMinor", () => {
  it("throws on invalid input so bugs surface loudly", () => {
    expect(() => toMinor("abc")).toThrow(/valid money amount/);
  });
});

describe("assertMinor", () => {
  it("rejects a non-integer, which means someone divided by 100 too early", () => {
    expect(() => assertMinor(45.5)).toThrow(/integer count of minor units/);
  });

  it("accepts integers including zero and negatives", () => {
    expect(() => assertMinor(0)).not.toThrow();
    expect(() => assertMinor(-4550)).not.toThrow();
  });
});

describe("toMajor", () => {
  it("converts cents back to the major unit", () => {
    expect(toMajor(4550)).toBe(45.5);
    expect(toMajor(0)).toBe(0);
  });
});

describe("sumMinor", () => {
  it("sums an empty list to zero", () => {
    expect(sumMinor([])).toBe(0);
  });

  it("sums many amounts exactly", () => {
    const cents = Array.from({ length: 1000 }, () => 1); // 1000 x $0.01
    expect(sumMinor(cents)).toBe(1000);
    expect(formatMoney(sumMinor(cents))).toBe("$10.00");
  });

  it("throws if handed a float", () => {
    expect(() => sumMinor([100, 45.5])).toThrow();
  });
});

describe("savingsRate", () => {
  it("computes the fraction saved", () => {
    expect(savingsRate(500000, 400000)).toBeCloseTo(0.2);
  });

  it("goes negative when overspending", () => {
    expect(savingsRate(100000, 150000)).toBeCloseTo(-0.5);
  });

  it("returns null with no income rather than dividing by zero", () => {
    expect(savingsRate(0, 5000)).toBeNull();
  });
});

describe("percentChange", () => {
  it("computes change against the previous period", () => {
    expect(percentChange(150, 100)).toBeCloseTo(0.5);
    expect(percentChange(50, 100)).toBeCloseTo(-0.5);
  });

  it("returns null when the previous period was empty", () => {
    expect(percentChange(100, 0)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("uses Latin digits and grouping separators", () => {
    expect(formatMoney(123456789)).toBe("$1,234,567.89");
  });

  it("always shows both minor-unit digits", () => {
    expect(formatMoney(10000)).toBe("$100.00");
    expect(formatMoney(5)).toBe("$0.05");
  });

  it("formats each supported currency", () => {
    expect(formatMoney(4550, "EUR")).toBe("€45.50");
    expect(formatMoney(4550, "GBP")).toBe("£45.50");
  });

  it("throws rather than silently rendering a float", () => {
    expect(() => formatMoney(45.5)).toThrow();
  });
});

describe("formatMoneyCompact", () => {
  it("shortens large figures for chart axes", () => {
    expect(formatMoneyCompact(123456700)).toMatch(/1\.2M/);
  });
});

describe("formatPercent", () => {
  it("renders a fraction as a percentage in Latin digits", () => {
    expect(formatPercent(0.184)).toBe("18%");
    expect(formatPercent(-0.5)).toBe("-50%");
  });
});

describe("isCurrency", () => {
  it("accepts supported codes and rejects everything else", () => {
    expect(isCurrency("CAD")).toBe(true);
    expect(isCurrency("IRR")).toBe(false);
    expect(isCurrency(null)).toBe(false);
  });
});
