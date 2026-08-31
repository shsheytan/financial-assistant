# دستیار مالی — working rules

Persian-first personal finance web app. UI is entirely Persian and RTL; the
codebase — names, tables, comments, commits — is entirely English.

`BRIEF.md` is the spec. `DECISIONS.md` records every non-obvious choice and why.
Read those before proposing something that contradicts them.

## Non-negotiable rules

**Money.** Every amount is an integer count of cents (`bigint` in Postgres,
`number` in TS). Converting, summing or comparing happens only in `lib/money.ts`;
displaying happens only through `<Money />`. No `/ 100` anywhere else — ESLint
enforces this. See the `money-module` skill.

**RTL.** Logical Tailwind utilities only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`),
never `ml-`/`mr-`/`left-`/`right-`. Amounts inside Persian text need direction
isolation, which `<Money />` already provides. See the `rtl-money-display` skill.

**Secrets.** No API key ever reaches the browser. Server-only config lives in
`lib/env.server.ts`, which imports `server-only` so a client import is a build
error — do not work around it. `lib/env.ts` is the public half and is safe
anywhere. AI calls happen only in Route Handlers.

**AI output is never saved directly.** Text, voice and receipt input all pass
through a confirmation card the user can edit before anything is written. Every
model response is validated with Zod at the server boundary; low-confidence
fields are marked visibly.

**RLS on every table**, with `(select auth.uid())` rather than a bare
`auth.uid()` — the subquery is evaluated once per statement instead of once per
row. Any new table ships with its policies in the same migration.

**Dates.** "This month" is computed against the user's timezone via
`lib/date.ts`, never the server clock. Gregorian calendar, `fa-IR` formatting.

## Commands

```
pnpm dev · pnpm build · pnpm typecheck · pnpm lint · pnpm test
pnpm db:start · pnpm db:push · pnpm db:reset · pnpm db:types
```

A milestone is done when `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
all pass clean, every async path has loading/error/empty states, and the layout
holds at 375px.

## Conventions

Conventional commits (`feat:`, `fix:`, `chore:`). No `any` without a comment
justifying it. Validate every input — form, API, and model output — with Zod.
