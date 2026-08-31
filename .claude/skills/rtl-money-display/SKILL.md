---
name: rtl-money-display
description: Right-to-left layout rules for this Persian UI. Use when writing or reviewing any JSX, Tailwind classes, or CSS — especially margins/padding/alignment, icons that point somewhere, dates, numbers inside Persian sentences, Radix/shadcn primitives (Dropdown, Popover, Select, Sheet, Tooltip), charts, or anything rendering an amount. Triggers on app/, components/, globals.css.
---

# RTL in this codebase

The interface is entirely Persian with `dir="rtl"` on `<html>`. Numbers stay in
Latin digits. That mix is where the bugs live, and none of them are visible to
someone who does not read Persian.

## Logical properties, never physical

Tailwind's physical utilities are hardcoded to the left and right of the screen.
The logical ones follow the text direction, so they keep working in both.

| Never | Always |
|---|---|
| `ml-` `mr-` | `ms-` `me-` |
| `pl-` `pr-` | `ps-` `pe-` |
| `left-` `right-` | `start-` `end-` |
| `text-left` `text-right` | `text-start` `text-end` |
| `border-l` `border-r` | `border-s` `border-e` |
| `rounded-l-*` `rounded-r-*` | `rounded-s-*` `rounded-e-*` |

In raw CSS the same rule holds: `margin-inline-start`, `inset-inline-start`,
`padding-inline-end`. A bare `left:` in a stylesheet is a bug in this project.

Physical is correct in exactly one case: something anchored to the *viewport*
rather than the text, and a scrollbar is the only real example.

## Amounts inside Persian text

Render every amount with `<Money minor={...} />`. Never format one by hand.

The component sets `dir="ltr"` and `unicode-bidi: isolate` on the span. Without
that isolation the bidi algorithm reorders the currency symbol against the
surrounding Persian and `$45.50` renders as `45.50$`, or the `$` migrates to the
far end of the sentence. It is not a styling preference — it is the difference
between a correct number and a wrong one.

It also applies `tabular` (`font-variant-numeric: tabular-nums`) so a column of
amounts aligns on the decimal point instead of shimmering as digits change.

## Directional icons must mirror

Arrows, chevrons, back and next, and progress indicators point the wrong way
under RTL unless flipped. Mirror with `rtl:-scale-x-100` or pick the mirrored
icon. Icons with no direction — a wallet, a check, a trash can — must **not** be
flipped; a mirrored logo just looks broken.

Trend arrows on dashboard cards are a special case: up and down are absolute,
not directional. Leave those alone.

## Radix and shadcn primitives

`Dropdown`, `Popover`, `Select`, `Sheet`, `Tooltip` and friends compute their
placement from an explicit `dir`. When it is missing they open away from their
trigger, or animate in from the wrong edge. Pass `dir="rtl"` — via a provider at
the root, or per component. These are the most-used primitives in this app: the
four-tab entry modal, inline edit in the transaction list, the month picker.

## Charts

Recharts lays out left-to-right and does not read `dir`. Reverse the category
axis so the earliest month sits on the **right**, and put the Y axis on the right
via `orientation="right"`. Tick formatters must go through `formatMoneyCompact`
from `lib/money.ts` — a chart axis is still money.

## How to actually catch this

Read the screen at 375px with `dir="rtl"`. The tell is always the same: an
element hugging the wrong edge, or a number whose currency symbol has drifted.
Neither shows up in typecheck, lint, or a unit test.
