# آرشیو

نسخه‌های اولیهٔ بریف محصول، پیش از یکی‌سازی. **هیچ‌کدام معتبر نیستند.**

سه تناقضی که باعث بازنویسی شد:

- `Final_Claude_Code_Master_Brief.md` چندارزی و یک جدول `accounts` می‌خواست؛
  `financial-assistant-claude-code-prompt.md` صراحتاً می‌گفت در MVP هر کاربر یک
  ارز دارد. پیاده‌سازی دومی را گرفت (`D-000a`) و جدول `accounts` وجود ندارد.
- هر دو شناسه‌های مدلِ بازنشسته داشتند (`claude-3.5-sonnet`، `gemini-1.5-flash`،
  `claude-sonnet-4-6`). شناسه‌های واقعی در `BRIEF.md` و `DECISIONS.md` هستند.
- لیست متغیرهای محیطی‌شان (`ANTHROPIC_API_KEY`، `OPENAI_API_KEY`) با
  `.env.example` واقعی (`GEMINI_API_KEY`، `GROQ_API_KEY`) نمی‌خواند.

سند معتبر: `BRIEF.md` در ریشهٔ پروژه.
