# دستیار مالی

وب‌اپلیکیشن مدیریت مالی شخصی، فارسی و راست‌چین، برای فارسی‌زبانان مقیم خارج از ایران.
کاربر هزینه‌هایش را با **فرم، متن آزاد، ضبط صدا یا عکس فاکتور** ثبت می‌کند و داشبورد
در هر لحظه نشان می‌دهد این ماه چقدر درآمد داشته، چقدر خرج کرده، چقدر مانده و نرخ
پس‌اندازش چقدر است.

**جملهٔ محک محصول:** ثبت یک خرید در کمتر از ۱۰ ثانیه، فهمیدن «چقدر برایم مانده» در
کمتر از ۵ ثانیه.

بریف محصول: [`BRIEF.md`](./BRIEF.md) · نقشهٔ فنی: [`PLAN.md`](./PLAN.md) · تصمیم‌ها: [`DECISIONS.md`](./DECISIONS.md)

قواعد کاری برای عامل‌های AI در [`CLAUDE.md`](./CLAUDE.md) است و هر سشن خودکار بارگذاری می‌شود؛ نسخه‌های اولیهٔ بریف در [`docs/archive/`](./docs/archive/) و معتبر نیستند.

---

## راه‌اندازی

نیازمندی‌ها: Node.js 20+ و pnpm 10+ (`npm i -g pnpm`)، و [Docker](https://docs.docker.com/get-docker/)
اگر می‌خواهی Supabase را محلی بالا بیاوری.

```bash
pnpm install
cp .env.example .env.local   # و مقادیر را پر کن
```

### دیتابیس

**گزینهٔ الف — Supabase محلی (نیازمند Docker):**

```bash
pnpm db:start     # Postgres + Auth + Storage را بالا می‌آورد و کلیدها را چاپ می‌کند
pnpm db:reset     # اجرای همهٔ migrationها + seed دسته‌بندی‌ها
pnpm db:types     # بازتولید lib/supabase/database.types.ts از schema زنده
```

`db:start` مقادیر `NEXT_PUBLIC_SUPABASE_URL`، anon key و service role key را چاپ
می‌کند؛ آن‌ها را در `.env.local` بگذار.

**گزینهٔ ب — پروژهٔ ابری Supabase:**

```bash
pnpm exec supabase link --project-ref <project-ref>
pnpm db:push
```

### اجرا

```bash
pnpm dev          # http://localhost:3000
```

---

## دستورها

| دستور | کار |
|---|---|
| `pnpm dev` | سرور توسعه (Turbopack) |
| `pnpm build` | بیلد پروडاکشن |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | تست‌های واحد (Vitest) |
| `pnpm e2e` | تست E2E (Playwright) |
| `pnpm db:start` / `db:reset` / `db:push` / `db:types` | Supabase |

---

## ساختار

```
app/                  مسیرها (App Router) و فونت‌های self-host شده
components/           کامپوننت‌های مشترک؛ components/ui = shadcn
features/             هر فیچر: components/ hooks/ api/ schema.ts
lib/
  money.ts            تنها مسیر مجاز محاسبه و نمایش پول
  date.ts             تاریخ و «ماه جاری» بر اساس timezone کاربر
  env.ts              اعتبارسنجی متغیرهای محیطی با Zod
  supabase/           client (مرورگر) · server (RSC/Action) · middleware
supabase/migrations/  schema، RLS، باکت‌های storage، seed
```

## قواعدی که نباید شکسته شوند

1. **پول همیشه `bigint` بر حسب سنت است.** ‏۴۵٫۵۰ دلار می‌شود `4550`. هیچ float ای
   در مسیر پول نیست، و فقط `lib/money.ts` اجازهٔ تبدیل، جمع و فرمت دارد. نمایش
   فقط از طریق کامپوننت `<Money />`.
2. **خروجی AI هرگز مستقیم ذخیره نمی‌شود.** همیشه اول در «کارت تأیید» قابل ویرایش
   به کاربر نشان داده می‌شود.
3. **RLS روی تمام جدول‌ها فعال است.** PostgREST جدول‌ها را مستقیم expose می‌کند؛
   لایهٔ API جایگزین RLS نیست.
4. **هیچ کلیدی به کلاینت نمی‌رود.** تمام فراخوانی‌های Gemini و Groq فقط در Route
   Handler سمت سرور.
5. **RTL با ویژگی‌های منطقی.** `ms-`/`me-`/`ps-`/`pe-` — نه `ml-`/`mr-`. آیکون
   جهت‌دار با `data-flip` آینه می‌شود.

## وضعیت

M0 (پایه) کامل است. مرحلهٔ بعد M1: احراز هویت.
جدول کامل milestoneها در [`PLAN.md`](./PLAN.md).
