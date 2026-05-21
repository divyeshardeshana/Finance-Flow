/*
  # Add prompt_limit to feature_tier_config

  ## Summary
  Adds an optional integer column `prompt_limit` to the `feature_tier_config` table.

  ## Changes
  - `feature_tier_config`: new nullable `prompt_limit integer` column
    - NULL means unlimited prompts for that feature/tier combination
    - A positive integer sets the maximum number of prompts per calendar month

  ## Notes
  - Existing rows are unaffected (default NULL = unlimited)
  - No RLS changes required; existing policies cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feature_tier_config' AND column_name = 'prompt_limit'
  ) THEN
    ALTER TABLE feature_tier_config ADD COLUMN prompt_limit integer DEFAULT NULL;
  END IF;
END $$;
