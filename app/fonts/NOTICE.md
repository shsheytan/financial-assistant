# Bundled font

**Estedad** v8.5 — `Estedad-Variable.woff2` (upstream filename `Estedad[wght].woff2`)

- Source: <https://github.com/aminabedi68/Estedad>
- License: SIL Open Font License 1.1 — <https://openfontlicense.org/>

Self-hosted deliberately. Google Fonts and most font CDNs are unreachable from
Iran, and part of this app's audience travels back; a CDN-loaded font would
render the entire UI in a fallback for those users.

One variable file covers weights 100–900, which is the whole type system in a
single request — see the typography section of [`PLAN.md`](../../PLAN.md).

To update: download the release from the repo above, convert
`Estedad[wght].woff2` to `Estedad-Variable.woff2`, and replace the file. No code
change is needed unless the weight axis range changes (see `app/fonts.ts`).
