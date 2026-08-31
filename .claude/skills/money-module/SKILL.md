---
name: money-module
description: Rules for handling money in this app. Use when touching amounts, balances, totals, sums, savings rate, percent change, currency formatting, transaction rows, dashboard cards, chart values, or anything reading amount/amount_minor/balance/target_amount from Supabase. Triggers on lib/money.ts, components/money.tsx, and any file doing arithmetic on an amount.
---

# Money in this codebase

Every amount is an **integer count of the currency's minor unit** — cents.
`$45.50` is `4550`. Never `45.5`. The DB column is `bigint`; the TypeScript type
is `number`, which is exact to 2^53 and so cannot lose a cent at any balance a
person will have.

## The two-file rule

| Need | Only allowed way |
|---|---|
| convert, sum, compare, compute | a function from `lib/money.ts` |
| show an amount to a user | the `<Money />` component |

Nothing else may do either. If you are about to write `/ 100`, `* 100`,
`toFixed`, or `Intl.NumberFormat` on an amount, stop — the function you want
already exists, and ESLint will reject the arithmetic anyway.

## The API that exists

Use these names exactly; do not invent siblings.

```ts
toMinor(input)            // "45.50" | 45.5 -> 4550. Throws on junk.
parseAmountToMinor(input) // same, but returns null instead of throwing
toMajor(minor)            // 4550 -> 45.5. For chart libraries only.
assertMinor(minor)        // tripwire: throws unless an integer
sumMinor(values)          // asserts every element, then adds
savingsRate(income, expense)   // null when income is 0 — not 0, not Infinity
percentChange(current, previous)
formatMoney(minor, currency, { signDisplay })
formatMoneyCompact(minor, currency)   // "$1.2M" for axes and tight cells
normalizeDigits(input)    // Persian/Arabic-Indic digits -> Latin
isCurrency(value) · CURRENCIES · DEFAULT_CURRENCY ("CAD") · type Currency
```

## Three failures this prevents

**Float drift.** `0.1 + 0.2` is `0.30000000000000004`. In a toy that is trivia;
in a ledger it is a balance that disagrees with the sum of its own rows.

**The bigint-to-string trap.** Postgres `bigint` exceeds `Number.MAX_SAFE_INTEGER`,
so drivers commonly return it as a **string** to avoid silent precision loss.
`"4550" + "1200"` is `"45501200"` — no error, no warning, just a wrong number on
the dashboard. Coerce at the Supabase boundary, and let `assertMinor` be the
tripwire: it rejects a string because `Number.isInteger("4550")` is false.

**Rounding invented money.** `parseAmountToMinor` *rejects* precision finer than
the currency has (`45.999`) rather than rounding it. Rounding here would be
inventing a fraction of a cent the user never typed.

## Persian input

Users type `۴۵٫۵۰`. `normalizeDigits` maps Persian and Arabic-Indic digits plus
the Arabic decimal separator to Latin. Call it on any free-text amount — form
fields and model output alike — before parsing.

## Why the rule is this strict

The rule survives only while it is unbroken. One `amount / 100` in one component
three months from now is silent, passes typecheck and lint, and produces a number
that is wrong by a factor of 100 in exactly one place on one screen.
`money.test.ts` pins this behaviour; run `pnpm test` after touching the module.
