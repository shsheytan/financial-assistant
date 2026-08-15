/**
 * Database types.
 *
 * Hand-written to match supabase/migrations/*.sql so the app is type-safe
 * before anyone has a database running. Once you have a local Supabase up,
 * `pnpm db:types` regenerates this file from the live schema — treat the
 * generated output as authoritative from that point on and keep this file in
 * sync by regenerating rather than editing.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CurrencyCode = "CAD" | "USD" | "EUR" | "GBP" | "AUD";
export type CategoryKind = "expense" | "income";
export type TransactionType = "expense" | "income";
export type TransactionSource =
  | "form"
  | "text"
  | "voice"
  | "receipt"
  | "recurring";
export type MediaKind = "audio" | "image";
export type MediaStatus = "uploaded" | "processing" | "parsed" | "failed";
export type IncomeFrequency =
  | "monthly"
  | "biweekly"
  | "weekly"
  | "yearly"
  | "one_time";
export type RecurringFrequency = "monthly" | "quarterly" | "yearly";
export type EmploymentStatus =
  | "employed"
  | "self_employed"
  | "student"
  | "retired"
  | "unemployed"
  | "other";
export type RiskLabel = "conservative" | "balanced" | "growth";
export type GoalType =
  | "emergency_fund"
  | "home"
  | "travel"
  | "debt_payoff"
  | "education"
  | "investment"
  | "other";
export type GoalStatus = "active" | "achieved" | "paused" | "cancelled";
export type AiFeature = "parse_text" | "parse_receipt" | "stt";
export type AiStatus = "success" | "error" | "rejected";

/** Row/Insert/Update triple, where Insert omits DB-defaulted columns. */
type Table<Row, RequiredOnInsert extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, RequiredOnInsert> & Partial<Omit<Row, RequiredOnInsert>>;
  Update: Partial<Row>;
};

export interface ProfileRow {
  id: string;
  full_name: string | null;
  country_code: string | null;
  timezone: string;
  base_currency: CurrencyCode;
  birth_year: number | null;
  employment_status: EmploymentStatus | null;
  risk_score: number | null;
  risk_label: RiskLabel | null;
  monthly_income_estimate: number | null;
  has_debt: boolean | null;
  debt_amount: number | null;
  emergency_fund_months: number | null;
  savings_rate_target: number | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string | null;
  name_fa: string;
  slug: string;
  kind: CategoryKind;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface IncomeSourceRow {
  id: string;
  user_id: string;
  title: string;
  type:
    | "salary"
    | "freelance"
    | "business"
    | "investment"
    | "rental"
    | "pension"
    | "other";
  amount: number;
  currency: CurrencyCode;
  frequency: IncomeFrequency;
  is_active: boolean;
  started_on: string | null;
  ended_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpenseRow {
  id: string;
  user_id: string;
  title: string;
  category_id: string | null;
  amount: number;
  currency: CurrencyCode;
  frequency: RecurringFrequency;
  due_day: number;
  is_active: boolean;
  auto_post: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaAssetRow {
  id: string;
  user_id: string;
  kind: MediaKind;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  status: MediaStatus;
  transcript: string | null;
  extracted: Json | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  type: TransactionType;
  /** Minor units (cents). Never format or divide this outside lib/money.ts. */
  amount: number;
  currency: CurrencyCode;
  category_id: string | null;
  merchant: string | null;
  note: string | null;
  occurred_on: string;
  source: TransactionSource;
  media_asset_id: string | null;
  recurring_expense_id: string | null;
  posted_month: string | null;
  ai_confidence: number | null;
  ai_raw: Json | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  type: GoalType;
  target_amount: number;
  saved_amount: number;
  currency: CurrencyCode;
  target_date: string | null;
  priority: number;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface AiUsageLogRow {
  id: string;
  user_id: string;
  feature: AiFeature;
  provider: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_cents: number | null;
  latency_ms: number | null;
  status: AiStatus;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, "id">;
      categories: Table<CategoryRow, "name_fa" | "slug">;
      income_sources: Table<
        IncomeSourceRow,
        "user_id" | "title" | "type" | "amount" | "currency" | "frequency"
      >;
      recurring_expenses: Table<
        RecurringExpenseRow,
        | "user_id"
        | "title"
        | "amount"
        | "currency"
        | "frequency"
        | "due_day"
      >;
      media_assets: Table<
        MediaAssetRow,
        "user_id" | "kind" | "storage_path" | "mime_type" | "size_bytes"
      >;
      transactions: Table<
        TransactionRow,
        "user_id" | "type" | "amount" | "currency" | "occurred_on"
      >;
      goals: Table<
        GoalRow,
        "user_id" | "title" | "type" | "target_amount" | "currency"
      >;
      ai_usage_logs: Table<
        AiUsageLogRow,
        "user_id" | "feature" | "provider" | "model" | "status"
      >;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
