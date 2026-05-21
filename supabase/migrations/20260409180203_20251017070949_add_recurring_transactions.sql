-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  description text DEFAULT '',
  payment_method text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  next_occurrence date NOT NULL,
  last_generated date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring transactions"
  ON recurring_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recurring transactions"
  ON recurring_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recurring transactions"
  ON recurring_transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own recurring transactions"
  ON recurring_transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add recurring_transaction_id to transactions table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'recurring_transaction_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN recurring_transaction_id uuid REFERENCES recurring_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_next 
  ON recurring_transactions(user_id, next_occurrence) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_transactions_recurring_id 
  ON transactions(recurring_transaction_id) WHERE recurring_transaction_id IS NOT NULL;

-- Create function to calculate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  occurrence_date date,
  freq text
) RETURNS date AS $$
BEGIN
  CASE freq
    WHEN 'daily' THEN
      RETURN occurrence_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN occurrence_date + INTERVAL '1 week';
    WHEN 'biweekly' THEN
      RETURN occurrence_date + INTERVAL '2 weeks';
    WHEN 'monthly' THEN
      RETURN occurrence_date + INTERVAL '1 month';
    WHEN 'yearly' THEN
      RETURN occurrence_date + INTERVAL '1 year';
    ELSE
      RETURN occurrence_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;
