-- ============================================================================
-- System categories.
--
-- These slugs are a contract in three places at once:
--   1. the AI prompt, which is told to choose only from this list;
--   2. the Zod schema that validates the model's output;
--   3. the dashboard's category breakdown chart.
-- Renaming a slug therefore needs a migration AND a prompt change. The Persian
-- label can be edited freely — it is display only.
--
-- Idempotent so `supabase db reset` and re-running against an existing project
-- both behave.
-- ============================================================================

insert into public.categories (name_fa, slug, kind, icon, is_system, sort_order)
values
  -- Expense
  ('خوراک و سوپرمارکت', 'groceries',      'expense', 'shopping-basket', true, 10),
  ('رستوران و کافه',    'dining',         'expense', 'utensils',        true, 20),
  ('مسکن و اجاره',      'housing',        'expense', 'home',            true, 30),
  ('قبوض',              'utilities',      'expense', 'receipt',         true, 40),
  ('حمل‌ونقل',           'transport',      'expense', 'bus',             true, 50),
  ('خودرو و سوخت',      'car',            'expense', 'car',             true, 60),
  ('سلامت و درمان',     'health',         'expense', 'heart-pulse',     true, 70),
  ('پوشاک',             'clothing',       'expense', 'shirt',           true, 80),
  ('سرگرمی',            'entertainment',  'expense', 'clapperboard',    true, 90),
  ('اشتراک‌ها',          'subscriptions',  'expense', 'repeat',          true, 100),
  ('آموزش',             'education',      'expense', 'graduation-cap',  true, 110),
  ('هدیه',              'gifts',          'expense', 'gift',            true, 120),
  ('بیمه',              'insurance',      'expense', 'shield',          true, 130),
  ('بازپرداخت وام',     'loan_repayment', 'expense', 'landmark',        true, 140),
  ('متفرقه',            'other_expense',  'expense', 'ellipsis',        true, 999),

  -- Income. The text/voice pipeline can produce income rows too ("این ماه
  -- ۳۰۰ دلار فریلنس گرفتم"), so the model needs slugs on this side as well.
  ('حقوق',              'salary',         'income',  'wallet',          true, 10),
  ('فریلنس',            'freelance',      'income',  'laptop',          true, 20),
  ('سرمایه‌گذاری',       'investment',     'income',  'trending-up',     true, 30),
  ('هدیه دریافتی',      'gift_received',  'income',  'gift',            true, 40),
  ('سایر درآمد',        'other_income',   'income',  'ellipsis',        true, 999)
on conflict do nothing;
