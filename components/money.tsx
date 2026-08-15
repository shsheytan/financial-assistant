import { cn } from "@/lib/utils";
import {
  formatMoney,
  formatMoneyCompact,
  DEFAULT_CURRENCY,
  type Currency,
} from "@/lib/money";

type MoneyProps = {
  /** Amount in minor units (cents). */
  minor: number;
  currency?: Currency;
  /** Compact form for chart axes and tight cells: "$1.2M". */
  compact?: boolean;
  /** Colour by sign. Only pass this where the sign carries meaning. */
  colored?: boolean;
  signDisplay?: "auto" | "always" | "never";
  className?: string;
};

/**
 * The only way money is rendered.
 *
 * Two things it exists to guarantee, both of which are easy to forget at a
 * call site and invisible until a Persian speaker looks at the screen:
 *
 *  - Direction isolation. A Latin-digit amount inside RTL Persian text will
 *    otherwise render as "45.50$" or throw the symbol to the far side of the
 *    sentence. dir="ltr" plus unicode-bidi:isolate pins it.
 *  - Tabular figures, so a column of amounts lines up on the decimal point
 *    instead of shimmering as the digits change.
 */
export function Money({
  minor,
  currency = DEFAULT_CURRENCY,
  compact = false,
  colored = false,
  signDisplay = "auto",
  className,
}: MoneyProps) {
  const text = compact
    ? formatMoneyCompact(minor, currency)
    : formatMoney(minor, currency, { signDisplay });

  return (
    <span
      dir="ltr"
      style={{ unicodeBidi: "isolate" }}
      className={cn(
        "tabular",
        colored && minor > 0 && "text-positive",
        colored && minor < 0 && "text-negative",
        className,
      )}
    >
      {text}
    </span>
  );
}
