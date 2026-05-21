/*
  # Add Milestones and Categories to Savings Goals

  ## Overview
  Enhances savings goals with milestone tracking and goal categories.
  This is part of the Advanced Goal Planning feature for Paid Plan users.

  ## New Tables Created

  ### 1. `goal_milestones`
  Track progress milestones for savings goals:
  - `id` (uuid, primary key)
  - `goal_id` (uuid, FK to savings_goals)
  - `title` (text) - Milestone title
  - `target_amount` (numeric) - Amount to reach for this milestone
  - `target_date` (date) - Optional target date
  - `is_completed` (boolean) - Whether milestone is reached
  - `completed_at` (timestamptz) - When milestone was completed
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)

  ## Table Updates

  ### Update `savings_goals`
  Add fields for better goal management:
  - `goal_category` (text) - emergency_fund, vacation, home, education, retirement, other
  - `auto_contribution` (numeric) - Suggested monthly contribution amount
  - `contribution_day` (integer) - Day of month for auto-contribution (1-31)

  ## Security
  - Enable RLS on goal_milestones
  - Users can only access milestones for their own goals

  ## Indexes
  - Index on goal_id for efficient milestone lookups
*/

-- Add new fields to savings_goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'savings_goals' AND column_name = 'goal_category'
  ) THEN
    ALTER TABLE savings_goals ADD COLUMN goal_category text DEFAULT 'other' 
      CHECK (goal_category IN ('emergency_fund', 'vacation', 'home', 'education', 'retirement', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'savings_goals' AND column_name = 'auto_contribution'
  ) THEN
    ALTER TABLE savings_goals ADD COLUMN auto_contribution numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'savings_goals' AND column_name = 'contribution_day'
  ) THEN
    ALTER TABLE savings_goals ADD COLUMN contribution_day integer CHECK (contribution_day >= 1 AND contribution_day <= 31);
  END IF;
END $$;

-- Create goal_milestones table
CREATE TABLE IF NOT EXISTS goal_milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  target_date date,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones for own goals"
  ON goal_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM savings_goals
      WHERE savings_goals.id = goal_milestones.goal_id
      AND savings_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert milestones for own goals"
  ON goal_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM savings_goals
      WHERE savings_goals.id = goal_milestones.goal_id
      AND savings_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones for own goals"
  ON goal_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM savings_goals
      WHERE savings_goals.id = goal_milestones.goal_id
      AND savings_goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM savings_goals
      WHERE savings_goals.id = goal_milestones.goal_id
      AND savings_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones for own goals"
  ON goal_milestones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM savings_goals
      WHERE savings_goals.id = goal_milestones.goal_id
      AND savings_goals.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id, order_index);

-- Function to auto-complete milestones when goal progress reaches target
CREATE OR REPLACE FUNCTION check_milestone_completion()
RETURNS TRIGGER AS $$
DECLARE
  milestone RECORD;
BEGIN
  FOR milestone IN
    SELECT * FROM goal_milestones
    WHERE goal_id = NEW.id
    AND is_completed = false
    AND target_amount <= NEW.current_amount
  LOOP
    UPDATE goal_milestones
    SET is_completed = true, completed_at = now()
    WHERE id = milestone.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for milestone completion
DROP TRIGGER IF EXISTS check_milestone_completion_trigger ON savings_goals;
CREATE TRIGGER check_milestone_completion_trigger
  AFTER UPDATE OF current_amount ON savings_goals
  FOR EACH ROW
  WHEN (NEW.current_amount > OLD.current_amount)
  EXECUTE FUNCTION check_milestone_completion();

-- Function to calculate suggested auto-contribution
CREATE OR REPLACE FUNCTION calculate_suggested_contribution(
  goal_id_param uuid
) RETURNS numeric AS $$
DECLARE
  goal RECORD;
  months_remaining numeric;
  remaining_amount numeric;
  suggested_amount numeric;
BEGIN
  SELECT * INTO goal FROM savings_goals WHERE id = goal_id_param;
  
  IF goal.status != 'active' THEN
    RETURN 0;
  END IF;
  
  remaining_amount := goal.target_amount - goal.current_amount;
  
  IF remaining_amount <= 0 THEN
    RETURN 0;
  END IF;
  
  IF goal.deadline IS NULL THEN
    RETURN ROUND(remaining_amount / 12, 2);
  END IF;
  
  months_remaining := GREATEST(
    EXTRACT(YEAR FROM age(goal.deadline, CURRENT_DATE)) * 12 +
    EXTRACT(MONTH FROM age(goal.deadline, CURRENT_DATE)),
    1
  );
  
  suggested_amount := ROUND(remaining_amount / months_remaining, 2);
  
  RETURN suggested_amount;
END;
$$ LANGUAGE plpgsql;