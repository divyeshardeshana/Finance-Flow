/*
  # Add prompt_limit to feature_tier_config and image_url to app_features

  ## Changes

  1. Modified Tables
    - `feature_tier_config`
      - Added `prompt_limit` (integer, nullable) - Monthly prompt limit per tier for AI features; NULL means unlimited
    - `app_features`
      - Added `image_url` (text, nullable) - URL of an image representing the feature, used in UI displays

  ## Notes
  - Both columns are nullable to preserve backward compatibility with existing rows
  - prompt_limit = NULL means unlimited prompts for that tier
  - image_url = NULL means no image assigned (UI should show a fallback icon)
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_features' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE app_features ADD COLUMN image_url text DEFAULT NULL;
  END IF;
END $$;
