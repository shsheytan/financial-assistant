> ⚠️ **تاریخی — معتبر نیست.** این یکی از دو بریف اولیه است. آن دو با یکدیگر و با
> کدِ ساخته‌شده تناقض داشتند (چندارزی در برابر تک‌ارزی، جدول `accounts`، و
> شناسه‌های مدلِ بازنشسته‌شده). سند معتبر `BRIEF.md` در ریشهٔ پروژه است و دلیل هر
> انحراف در `DECISIONS.md` ثبت شده. این فایل فقط برای ردیابی تاریخچهٔ تصمیم نگه
> داشته شده است.

---

# دستورالعمل نهایی و جامع توسعه (Master Brief): وب‌اپلیکیشن دستیار مالی شخصی

> **INSTRUCTIONS FOR CLAUDE CODE (OR ANY AI CODING AGENT):**
> You are a Senior Full-Stack Engineer. This document is the SINGLE SOURCE OF TRUTH for the project.
> **First action:** Read this document entirely. Then, create a `PLAN.md` outlining the architecture, folder structure (Feature-Sliced Design), and a step-by-step implementation plan. Wait for the user's approval before writing any actual code.

---

## ۱. مشخصات کلان پروژه (Project Overview)
- **موضوع:** وب‌اپلیکیشن مدیریت مالی شخصی با قابلیت ثبت تراکنش از طریق هوش مصنوعی (صدا، عکس، متن).
- **زبان و بومی‌سازی:** 
  - رابط کاربری (UI): کاملاً فارسی و راست‌چین (RTL).
  - کدبیس، متغیرها، دیتابیس و کامیت‌ها: کاملاً انگلیسی.
  - تقویم: میلادی (Gregorian).
  - ارز پایه پیش‌فرض: `CAD` (امکان پشتیبانی از چند ارز برای حساب‌های مختلف).

## ۲. استک تکنولوژی (Tech Stack)
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui (RTL-configured) + Lucide Icons
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, RLS Policies)
- **State Management & Data Fetching:** TanStack Query (React Query)
- **Forms & Validation:** react-hook-form + Zod
- **AI Integrations:**
  - **Speech-to-Text (Voice):** Groq API (Whisper model) - برای سرعت بالا و هزینه پایین.
  - **Text/Image-to-JSON:** Anthropic Claude 3.5 Sonnet یا Google Gemini 1.5 Flash.

## ۳. معماری و قوانین توسعه (Architecture & Rules)
- **ماژولار بودن:** استفاده از ساختار Feature-based. لایه سرویس‌ها (Supabase و AI) باید از کامپوننت‌های UI جدا باشند.
- **قانون پول (Money Rule):** هیچ مبلغی به صورت اعشاری (Float) ذخیره نمی‌شود. تمام مبالغ باید در دیتابیس به عنوان `BIGINT` و بر اساس کوچکترین واحد ارز (مثلاً سنت) ذخیره شوند.
- **قانون ثبت AI:** خروجی هوش مصنوعی **هرگز** مستقیماً در دیتابیس ذخیره نمی‌شود. خروجی باید ابتدا در یک "کارت تایید" (Confirmation Card) به کاربر نمایش داده شود تا در صورت نیاز ویرایش کرده و سپس ثبت نهایی کند.
- **ذخیره‌سازی فایل:** تمام فایل‌های صوتی و تصاویر فاکتور باید به صورت دائمی در Supabase Storage (در باکت‌های خصوصی با RLS) ذخیره شوند و لینک آن‌ها در تراکنش ثبت شود.

## ۴. فیچرهای اصلی نسخه اولیه (MVP Features)
1. **احراز هویت (Auth):** ثبت‌نام/ورود با ایمیل و Google OAuth.
2. **Onboarding (چند مرحله‌ای):**
   - دریافت اطلاعات پایه، تعیین ریسک‌پذیری، منابع درآمد، هزینه‌های ثابت و اهداف مالی.
   - داشتن دکمه "فعلاً رد کن" (Skip) برای جلوگیری از خستگی کاربر.
3. **ثبت تراکنش (۴ روش):**
   - **دستی:** فرم استاندارد.
   - **متنی:** پردازش متن آزاد با AI.
   - **صوتی:** ضبط مستقیم صدا در وب‌اپلیکیشن، تبدیل به متن با Groq Whisper، سپس استخراج اطلاعات با AI.
   - **تصویری (فاکتور):** آپلود عکس، استخراج اطلاعات (مبلغ کل، فروشنده، تاریخ) با مدل‌های Vision.
4. **حساب‌های چندارزی (Multi-Currency):** امکان ایجاد کیف‌پول‌ها یا حساب‌های مختلف با ارزهای متفاوت (مثلاً کیف پول CAD و حساب بانکی USD).
5. **داشبورد:** نمایش درآمد، هزینه، تراز (Balance)، درصد پس‌انداز و نمودارهای توزیع هزینه (Recharts).

## ۵. مدل داده (PostgreSQL Schema)
طراحی جداول اصلی (باید با Row Level Security ایمن شوند):

```sql
-- Profiles (Onboarding Data)
profiles (id UUID PK, full_name TEXT, base_currency TEXT DEFAULT 'CAD', risk_score INT, onboarding_step INT)

-- Accounts (Multi-Currency Support)
accounts (id UUID PK, user_id UUID, name TEXT, currency TEXT, balance BIGINT)

-- Categories
categories (id UUID PK, user_id UUID, name_fa TEXT, type TEXT, icon TEXT)

-- Transactions
transactions (
  id UUID PK,
  user_id UUID,
  account_id UUID,
  type TEXT, -- income/expense
  amount BIGINT, -- in minor units (cents)
  currency TEXT,
  category_id UUID,
  merchant TEXT,
  occurred_on DATE,
  source TEXT, -- manual/voice/text/receipt
  media_url TEXT, -- Permanent link to Supabase Storage
  ai_metadata JSONB -- For debugging AI extractions
)
```

## ۶. پرامپت‌های سیستمی هوش مصنوعی (System Prompts)
این پرامپت‌ها باید در Route Handlerهای Next.js برای ارتباط با Claude/Gemini استفاده شوند:

**A. Text/Voice to JSON Prompt:**
```text
You are a highly precise financial data extraction API. 
The user will provide a text in Persian (transcribed voice or direct text) describing transactions.
Extract details and return ONLY a valid JSON object matching the provided Zod schema.
Rules:
1. Output ONLY JSON. No markdown formatting.
2. Amount must be an integer in minor units (e.g., cents).
3. If currency is not mentioned, use {{USER_DEFAULT_CURRENCY}}.
4. Categorize strictly into: {{ALLOWED_CATEGORIES}}.
5. Resolve relative dates (e.g. "yesterday") based on today: {{CURRENT_DATE}}.
```

**B. Receipt Image to JSON Prompt:**
```text
You are an expert OCR and financial analysis AI. 
Extract transaction details from the provided receipt image and return ONLY a valid JSON object.
Rules:
1. Output ONLY JSON. No markdown formatting.
2. Extract the TOTAL final amount paid.
3. Identify the currency ($ usually means CAD based on context).
4. Extract the exact date and merchant name.
5. If the image is not a receipt, return {"is_valid": false}.
```

## ۷. گردش کار و مراحل توسعه (Milestones)
- **Milestone 1:** راه‌اندازی پروژه، ساختار پوشه‌ها، Supabase Auth و تنظیمات RTL.
- **Milestone 2:** طراحی دیتابیس، RLS، و سیستم Onboarding.
- **Milestone 3:** سیستم Accounts (چندارزی) و فرم دستی ثبت تراکنش.
- **Milestone 4:** پیاده‌سازی متدهای ورودی AI (صدا، عکس، متن) + Storage + کارت تایید.
- **Milestone 5:** داشبورد، نمودارها و نهایی‌سازی UI.