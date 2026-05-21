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

CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id, order_index);

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

DROP TRIGGER IF EXISTS check_milestone_completion_trigger ON savings_goals;
CREATE TRIGGER check_milestone_completion_trigger
  AFTER UPDATE OF current_amount ON savings_goals
  FOR EACH ROW
  WHEN (NEW.current_amount > OLD.current_amount)
  EXECUTE FUNCTION check_milestone_completion();
