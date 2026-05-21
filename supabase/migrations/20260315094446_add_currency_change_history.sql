/*
  # Add Currency Change History Table

  ## Summary
  Creates a table to record every time a user changes their display currency preference.

  ## New Tables
  - `currency_change_history`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `from_currency` (text) - the currency code before the change
    - `to_currency` (text) - the currency code after the change
    - `exchange_rate` (numeric) - how many units of to_currency equal 1 unit of from_currency
    - `changed_at` (timestamptz) - when the change occurred

  ## Security
  - RLS enabled; users can only insert and read their own records
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
