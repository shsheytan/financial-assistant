import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Applied to every response. These are cheap, and the ones that matter here are
 * the last two: this app asks for the microphone (voice entry) and the camera
 * (receipt photos), so the browser must be told that nothing embedded in the
 * page is allowed to ask for either.
 */
const securityHeaders = [
  // Block the page being framed — the defence against clickjacking a
  // "confirm this transaction" button. frame-ancestors is the modern form;
  // X-Frame-Options is kept for older browsers that ignore CSP.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },

  // Stop the browser guessing a MIME type it wasn't given. A receipt upload
  // that gets sniffed as text/html is a stored-XSS vector.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Don't leak the path a user came from to third parties. Transaction URLs
  // will contain ids.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Force HTTPS for two years once seen. Harmless on localhost (browsers
  // ignore HSTS there).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Deny every powerful feature except the two this app genuinely uses, and
  // grant those only to our own origin — never to embedded content.
  {
    key: "Permissions-Policy",
    value: [
      "camera=(self)",
      "microphone=(self)",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
      "interest-cohort=()",
    ].join(", "),
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework version to scanners.
  poweredByHeader: false,

  // A stray `console.log` in a Server Action is how transaction contents end
  // up in a hosting provider's log aggregator.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
