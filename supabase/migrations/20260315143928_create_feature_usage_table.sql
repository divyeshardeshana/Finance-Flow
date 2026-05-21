/*
  # Create feature_usage table

  ## Summary
  Tracks how many times each user has used a specific feature within a calendar month.
  Used to enforce per-tier prompt limits (e.g. Financial Assistant: 40 prompts/month on Free tier).

  ## New Tables
  - `feature_usage`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK → auth.users)
    - `feature_name` (text) — matches app_features.feature_name
    - `usage_month` (date) — first day of the month (e.g. 2026-03-01)
    - `usage_count` (integer, default 0) — number of times feature used this month
    - `created_at` / `updated_at` timestamps
    - UNIQUE constraint on (user_id, feature_name, usage_month)

  ## Security
  - RLS enabled
  - Users can SELECT their own rows
  - Users can INSERT their own rows
  - Users can UPDATE their own rows (to increment counter)
  - No DELETE policy (audit trail)
*/

CREATE TABLE IF NOT EXISTS feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  usage_month date NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_name, usage_month)
);

ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature usage"
  ON feature_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feature usage"
  ON feature_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feature usage"
  ON feature_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature_month
  ON feature_usage(user_id, feature_name, usage_month);
