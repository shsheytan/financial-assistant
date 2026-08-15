import localFont from "next/font/local";

/**
 * Estedad, self-hosted. One variable file covers weights 100-900, so the whole
 * type system is a single request and no CDN is involved — Google Fonts and
 * most font CDNs are unreachable from Iran, and some users travel back.
 */
export const estedad = localFont({
  src: [
    {
      path: "./fonts/Estedad-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-estedad",
  display: "swap",
  // Persian text has taller ascenders than Latin; the fallback metrics Next
  // computes from Arial would reflow noticeably on swap without this.
  adjustFontFallback: false,
  fallback: ["Tahoma", "Segoe UI", "sans-serif"],
});
