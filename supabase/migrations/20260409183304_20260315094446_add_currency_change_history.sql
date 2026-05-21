/*
  # Add Currency Change History Table

  Creates a table to record every time a user changes their display currency preference.
*/

CREATE TABLE IF NOT EXISTS currency_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_currency text NOT NULL DEFAULT '',
  to_currency text NOT NULL DEFAULT '',
  exchange_rate numeric NOT NULL DEFAULT 1,
  changed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_currency_change_history_user_id ON currency_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_change_history_changed_at ON currency_change_history(changed_at DESC);

ALTER TABLE currency_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own currency history"
  ON currency_change_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own currency history"
  ON currency_change_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
