-- ============================================================================
-- Initial schema for «دستیار مالی»
--
-- Conventions used throughout:
--   * Money is bigint, counted in the currency's minor unit (cents). Never
--     numeric, never float. $45.50 is stored as 4550. See lib/money.ts.
--   * Enum-like columns are text + CHECK rather than Postgres enums, which
--     cannot be altered inside a transaction and make later migrations painful.
--   * Every user-owned table carries user_id and is protected by RLS in
--     20260815000002_rls_policies.sql. RLS is not optional on any of them.
-- ============================================================================

-- gen_random_uuid() is core Postgres since 13, so no extension is required.

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users, holds the onboarding answers
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Bounded because this arrives from signup metadata, which is entirely
  -- user-controlled. Unbounded text here lets anyone with an account store
  -- megabytes in a column we render on every screen.
  full_name text check (full_name is null or char_length(full_name) <= 120),

  country_code text check (country_code is null or char_length(country_code) = 2),
  timezone text not null default 'America/Toronto',
  base_currency text not null default 'CAD'
    check (base_currency in ('CAD', 'USD', 'EUR', 'GBP', 'AUD')),

  -- Generous sanity bounds only. The precise rule (>= 13 years old, relative to
  -- the current year) is enforced in Zod, because a CHECK cannot call now().
  birth_year int check (birth_year between 1930 and 2020),

  employment_status text check (
    employment_status is null or employment_status in
    ('employed', 'self_employed', 'student', 'retired', 'unemployed', 'other')
  ),

  risk_score int check (risk_score between 1 and 10),
  risk_label text check (
    risk_label is null or risk_label in ('conservative', 'balanced', 'growth')
  ),

  monthly_income_estimate bigint check (monthly_income_estimate >= 0),
  has_debt boolean,
  debt_amount bigint check (debt_amount >= 0),
  emergency_fund_months numeric(4, 1) check (emergency_fund_months >= 0),
  savings_rate_target numeric(4, 3) check (savings_rate_target between 0 and 1),

  onboarding_step int not null default 0 check (onboarding_step between 0 and 7),
  onboarding_completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

comment on column public.profiles.timezone is
  'IANA zone. "This month" is computed against this, not the server clock — see lib/date.ts.';

-- Create the profile row the moment a user signs up, so onboarding always has
-- somewhere to write. Doing this in application code instead would leave a
-- window where a user exists with no profile and the app 500s.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    -- Truncated, not rejected: raw_user_meta_data is attacker-controlled, and
    -- a CHECK violation here would abort the whole signup transaction and make
    -- account creation fail on a name that is merely too long.
    left(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name'
      ),
      120
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- categories — system rows have user_id = null and are visible to everyone
-- ----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name_fa text not null check (char_length(name_fa) between 1 and 60),
  slug text not null check (slug ~ '^[a-z0-9_]{1,40}$'),
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  icon text,
  color text,
  is_system boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A system row is exactly one with no owner. Keeps the two concepts from
  -- drifting apart (an "is_system" row owned by a user would be invisible to
  -- everyone else but still claim to be shared).
  constraint categories_system_has_no_owner
    check ((is_system and user_id is null) or (not is_system and user_id is not null))
);

-- Slugs are the contract with the AI: the model is told to pick only from this
-- list, so they must be unique per user and globally unique among system rows.
create unique index categories_system_slug_key
  on public.categories (slug) where user_id is null;
create unique index categories_user_slug_key
  on public.categories (user_id, slug) where user_id is not null;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- income_sources
-- ----------------------------------------------------------------------------
create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  type text not null check (type in (
    'salary', 'freelance', 'business', 'investment', 'rental', 'pension', 'other'
  )),
  amount bigint not null check (amount >= 0),
  currency text not null check (currency in ('CAD', 'USD', 'EUR', 'GBP', 'AUD')),
  frequency text not null check (frequency in (
    'monthly', 'biweekly', 'weekly', 'yearly', 'one_time'
  )),
  is_active boolean not null default true,
  started_on date,
  ended_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint income_sources_period_ordered
    check (ended_on is null or started_on is null or ended_on >= started_on)
);

create index income_sources_user_active_idx
  on public.income_sources (user_id, is_active);

create trigger income_sources_set_updated_at
  before update on public.income_sources
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- recurring_expenses
-- ----------------------------------------------------------------------------
create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category_id uuid references public.categories (id) on delete set null,
  amount bigint not null check (amount > 0),
  currency text not null check (currency in ('CAD', 'USD', 'EUR', 'GBP', 'AUD')),
  frequency text not null check (frequency in ('monthly', 'quarterly', 'yearly')),
  due_day int not null check (due_day between 1 and 31),
  is_active boolean not null default true,
  auto_post boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recurring_expenses_user_active_idx
  on public.recurring_expenses (user_id, is_active);

create trigger recurring_expenses_set_updated_at
  before update on public.recurring_expenses
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- media_assets — uploaded voice notes and receipt images
-- ----------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('audio', 'image')),
  storage_path text not null check (char_length(storage_path) <= 400),
  mime_type text not null check (char_length(mime_type) <= 100),
  size_bytes int not null check (size_bytes > 0),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'parsed', 'failed')),
  -- 60s of speech is well under this; the cap stops a malformed STT response
  -- from writing an unbounded blob.
  transcript text check (transcript is null or char_length(transcript) <= 8000),
  extracted jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_assets_user_status_idx
  on public.media_assets (user_id, status);

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- transactions — the centre of the app
-- ----------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),

  -- Always positive; direction is carried by `type`. A signed amount plus a
  -- type column is two sources of truth that will eventually disagree.
  amount bigint not null check (amount > 0),
  currency text not null check (currency in ('CAD', 'USD', 'EUR', 'GBP', 'AUD')),

  category_id uuid references public.categories (id) on delete set null,
  -- Both can arrive straight from a model's output; bound them at the DB so a
  -- prompt-injected receipt cannot write an essay into the row.
  merchant text check (merchant is null or char_length(merchant) <= 120),
  note text check (note is null or char_length(note) <= 500),
  occurred_on date not null,

  source text not null default 'form'
    check (source in ('form', 'text', 'voice', 'receipt', 'recurring')),
  media_asset_id uuid references public.media_assets (id) on delete set null,

  -- Set only for rows generated from a recurring expense.
  recurring_expense_id uuid references public.recurring_expenses (id) on delete set null,
  posted_month date,

  ai_confidence numeric(3, 2) check (ai_confidence between 0 and 1),
  ai_raw jsonb,

  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transactions_recurring_fields_together
    check (
      (recurring_expense_id is null and posted_month is null)
      or (recurring_expense_id is not null and posted_month is not null)
    )
);

-- The single guarantee that re-running the recurring-expense job cannot double
-- charge someone. Everything else about that job is best-effort; this is not.
create unique index transactions_recurring_once_per_month
  on public.transactions (recurring_expense_id, posted_month)
  where recurring_expense_id is not null;

-- Dashboard and transaction list both read "this user, this month, newest
-- first", excluding soft-deleted rows.
create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_on desc)
  where deleted_at is null;

create index transactions_user_category_idx
  on public.transactions (user_id, category_id)
  where deleted_at is null;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

comment on column public.transactions.posted_month is
  'First day of the month this recurring row was posted for. Half of the idempotency key.';

-- ----------------------------------------------------------------------------
-- goals — captured during onboarding, shown as a progress bar on the dashboard
-- ----------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  type text not null check (type in (
    'emergency_fund', 'home', 'travel', 'debt_payoff', 'education', 'investment', 'other'
  )),
  target_amount bigint not null check (target_amount > 0),
  saved_amount bigint not null default 0 check (saved_amount >= 0),
  currency text not null check (currency in ('CAD', 'USD', 'EUR', 'GBP', 'AUD')),
  target_date date,
  priority int not null default 1 check (priority between 1 and 5),
  status text not null default 'active'
    check (status in ('active', 'achieved', 'paused', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_status_idx on public.goals (user_id, status);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ai_usage_logs — cost visibility and the daily rate limit
-- ----------------------------------------------------------------------------
create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null check (feature in ('parse_text', 'parse_receipt', 'stt')),
  provider text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  cost_cents int,
  latency_ms int,
  status text not null check (status in ('success', 'error', 'rejected')),
  created_at timestamptz not null default now()
);

-- Supports "how many calls has this user made today", which gates every AI
-- request.
create index ai_usage_logs_user_created_idx
  on public.ai_usage_logs (user_id, created_at desc);
