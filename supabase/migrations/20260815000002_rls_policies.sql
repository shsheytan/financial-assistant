-- ============================================================================
-- Row Level Security
--
-- RLS is the only thing standing between one user's finances and another's.
-- The API layer is not a substitute: PostgREST exposes these tables directly,
-- so a user with their own valid JWT can query any table by hand. Acceptance
-- test #6 exercises exactly that.
--
-- Every policy wraps auth.uid() as (select auth.uid()). Postgres then evaluates
-- it once per statement instead of once per row, which is the difference
-- between an index scan and a sequential scan on the transactions table.
-- ============================================================================

alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.income_sources     enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.media_assets       enable row level security;
alter table public.transactions       enable row level security;
alter table public.goals              enable row level security;
alter table public.ai_usage_logs      enable row level security;

-- ----------------------------------------------------------------------------
-- profiles — keyed on id, not user_id
-- ----------------------------------------------------------------------------
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Insert is normally done by the on_auth_user_created trigger, but allow the
-- owner to self-heal if that row is ever missing.
create policy "profiles: insert own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

-- No delete policy: profiles die with the auth.users row via ON DELETE CASCADE.

-- ----------------------------------------------------------------------------
-- categories — everyone reads the system rows, users own their custom ones
-- ----------------------------------------------------------------------------
create policy "categories: read system and own"
  on public.categories for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);

create policy "categories: insert own"
  on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id and is_system = false);

create policy "categories: update own"
  on public.categories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and is_system = false);

create policy "categories: delete own"
  on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- The remaining tables all follow the same owner-only shape.
-- ----------------------------------------------------------------------------
create policy "income_sources: read own"
  on public.income_sources for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "income_sources: insert own"
  on public.income_sources for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "income_sources: update own"
  on public.income_sources for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "income_sources: delete own"
  on public.income_sources for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "recurring_expenses: read own"
  on public.recurring_expenses for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "recurring_expenses: insert own"
  on public.recurring_expenses for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "recurring_expenses: update own"
  on public.recurring_expenses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "recurring_expenses: delete own"
  on public.recurring_expenses for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "media_assets: read own"
  on public.media_assets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "media_assets: insert own"
  on public.media_assets for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "media_assets: update own"
  on public.media_assets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "media_assets: delete own"
  on public.media_assets for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "transactions: read own"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "transactions: insert own"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "transactions: update own"
  on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- Deletion in the UI is a soft delete (an UPDATE setting deleted_at) so that
-- undo works. A hard delete is still permitted for account deletion.
create policy "transactions: delete own"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "goals: read own"
  on public.goals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "goals: insert own"
  on public.goals for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "goals: update own"
  on public.goals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "goals: delete own"
  on public.goals for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- ai_usage_logs — readable by the owner, but append-only from their side.
-- Rows are written server-side. No update or delete policy exists, so a user
-- cannot erase their usage history to get around the daily cap.
-- ----------------------------------------------------------------------------
create policy "ai_usage_logs: read own"
  on public.ai_usage_logs for select to authenticated
  using ((select auth.uid()) = user_id);
