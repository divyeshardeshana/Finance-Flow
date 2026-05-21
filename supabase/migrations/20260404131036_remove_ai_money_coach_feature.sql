/*
  # Remove AI Money Coach Feature

  ## Summary
  Removes all database configuration records associated with the "AI Money Coach" feature.

  ## Changes
  - Deletes feature tier config rows for `ai_money_coach` from `feature_tier_config`
  - Deletes the feature definition row for `ai_money_coach` from `features` (if that table exists)
  - Deletes feature usage records for `ai_money_coach` from `feature_usage` (if that table exists)

  ## Notes
  - Uses IF EXISTS checks to prevent errors if tables or rows don't exist
  - No destructive table drops; only targeted row deletions
  - Safe to run multiple times (idempotent)
*/

DELETE FROM feature_tier_config WHERE feature_name = 'ai_money_coach';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features' AND table_schema = 'public') THEN
    DELETE FROM features WHERE feature_name = 'ai_money_coach';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_usage' AND table_schema = 'public') THEN
    DELETE FROM feature_usage WHERE feature_name = 'ai_money_coach';
  END IF;
END $$;
