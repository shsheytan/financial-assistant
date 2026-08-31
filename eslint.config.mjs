import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * Structural enforcement of the money rule.
 *
 * BRIEF.md and the money-module skill both say conversion happens only in
 * lib/money.ts. Those raise the odds of compliance; this makes a violation
 * impossible to merge. A stray `amount / 100` in a component passes typecheck
 * and renders a number wrong by a factor of 100 on exactly one screen — the
 * kind of bug that is found by a user, not by a test.
 */
const moneyRule = {
  "no-restricted-syntax": [
    "error",
    {
      selector: 'BinaryExpression[operator="/"][right.value=100]',
      message:
        "Dividing by 100 converts money. Use toMajor() from lib/money.ts, or render with <Money />.",
    },
    {
      selector: 'BinaryExpression[operator="*"][right.value=100]',
      message:
        "Multiplying by 100 converts money. Use toMinor() from lib/money.ts.",
    },
    {
      selector: 'BinaryExpression[operator="*"][left.value=100]',
      message:
        "Multiplying by 100 converts money. Use toMinor() from lib/money.ts.",
    },
  ],
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: moneyRule,
  },
  {
    // The one module allowed to know that a dollar is 100 cents, plus the
    // tests that pin its behaviour.
    files: ["lib/money.ts", "lib/*.test.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
];

export default eslintConfig;
