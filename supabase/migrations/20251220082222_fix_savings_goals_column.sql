/*
  # Fix Savings Goals Table Column Name

  1. Changes
    - Rename `goal_name` column to `name` for consistency with frontend code
    - Add NOT NULL constraints to required fields
    - Add check constraints for numeric fields to ensure they are >= 0
    - Add index on user_id for better query performance

  2. Security
    - No changes to RLS policies (already properly configured)
*/

-- Rename goal_name to name for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'savings_goals' AND column_name = 'goal_name'
  ) THEN
    ALTER TABLE savings_goals RENAME COLUMN goal_name TO name;
  END IF;
END $$;

-- Add check constraints for numeric fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'savings_goals_target_amount_positive'
  ) THEN
    ALTER TABLE savings_goals
    ADD CONSTRAINT savings_goals_target_amount_positive
    CHECK (target_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'savings_goals_current_amount_non_negative'
  ) THEN
    ALTER TABLE savings_goals
    ADD CONSTRAINT savings_goals_current_amount_non_negative
    CHECK (current_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'savings_goals_monthly_contribution_non_negative'
  ) THEN
    ALTER TABLE savings_goals
    ADD CONSTRAINT savings_goals_monthly_contribution_non_negative
    CHECK (monthly_contribution >= 0);
  END IF;
END $$;

-- Make target_date required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'savings_goals' AND column_name = 'target_date' AND is_nullable = 'YES'
  ) THEN
    -- Set a default date for existing rows with null target_date (1 year from now)
    UPDATE savings_goals SET target_date = CURRENT_DATE + INTERVAL '1 year' WHERE target_date IS NULL;
    -- Make the column NOT NULL
    ALTER TABLE savings_goals ALTER COLUMN target_date SET NOT NULL;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
