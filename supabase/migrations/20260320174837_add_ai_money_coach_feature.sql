/*
  # Add AI Money Coach Feature

  ## Summary
  This migration supports the new "AI Money Coach" chat page by:

  1. Adding a `feature_name` column to `assistant_conversations` to distinguish
     messages from the Financial Assistant vs the AI Money Coach. Defaults to
     'financial_assistant' so existing rows are unaffected.

  2. Inserting an `app_features` row for `ai_money_coach`.

  3. Inserting `feature_tier_config` rows for `ai_money_coach` for all three
     subscription tiers (free / paid / premium), with differentiated prompt limits:
     - free:    5 prompts / month
     - paid:   20 prompts / month
     - premium: unlimited (NULL)

  ## Modified Tables
  - `assistant_conversations` – new nullable text column `feature_name` (default 'financial_assistant')

  ## New Rows
  - `app_features` – ai_money_coach entry
  - `feature_tier_config` – per-tier config rows for ai_money_coach

  ## Security
  - No RLS changes needed; existing policies on `assistant_conversations` remain intact.

  ## Notes
  - `IF NOT EXISTS` guards prevent duplicate errors on re-run.
  - Tier lookup uses a subquery so we never hard-code UUIDs.
*/

-- 1. Add feature_name column if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assistant_conversations'
      AND column_name = 'feature_name'
  ) THEN
    ALTER TABLE assistant_conversations
      ADD COLUMN feature_name text NOT NULL DEFAULT 'financial_assistant';
  END IF;
END $$;

-- 2. Insert app_features row for ai_money_coach
INSERT INTO app_features (feature_name, display_name, description, category, route_path, is_active, sort_order)
VALUES (
  'ai_money_coach',
  'AI Money Coach',
  'Personalized AI coaching based on your real financial data',
  'intelligence',
  '/ai-money-coach',
  true,
  60
)
ON CONFLICT (feature_name) DO UPDATE
  SET display_name = 'AI Money Coach',
      description  = 'Personalized AI coaching based on your real financial data',
      is_active    = true;

-- 3. Seed feature_tier_config for ai_money_coach (free tier – 5 prompts)
INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled, prompt_limit)
SELECT
  'ai_money_coach',
  st.id,
  true,
  5
FROM subscription_tiers st
WHERE st.tier_name = 'free'
ON CONFLICT (feature_name, tier_id) DO UPDATE
  SET is_enabled = true, prompt_limit = 5;

-- 4. Seed feature_tier_config for ai_money_coach (paid tier – 20 prompts)
INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled, prompt_limit)
SELECT
  'ai_money_coach',
  st.id,
  true,
  20
FROM subscription_tiers st
WHERE st.tier_name = 'paid'
ON CONFLICT (feature_name, tier_id) DO UPDATE
  SET is_enabled = true, prompt_limit = 20;

-- 5. Seed feature_tier_config for ai_money_coach (premium tier – unlimited)
INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled, prompt_limit)
SELECT
  'ai_money_coach',
  st.id,
  true,
  NULL
FROM subscription_tiers st
WHERE st.tier_name = 'premium'
ON CONFLICT (feature_name, tier_id) DO UPDATE
  SET is_enabled = true, prompt_limit = NULL;
