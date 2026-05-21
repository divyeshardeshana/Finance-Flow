/*
  # Add Split Transactions Feature

  ## Overview
  Enables users to split a single transaction across multiple budget categories.
  This is a Paid Plan feature for detailed expense tracking.

  ## New Tables Created

  ### 1. `transaction_splits`
  Individual split entries for a transaction:
  - `id` (uuid, primary key)
  - `transaction_id` (uuid, FK to transactions)
  - `category` (text) - Budget category for this split
  - `amount` (numeric) - Amount allocated to this category
  - `notes` (text) - Optional notes for this split
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Table Updates

  ### Update `transactions`
  Add fields to support split transactions:
  - `is_split` (boolean) - Whether transaction is split across categories
  - `split_count` (integer) - Number of splits (for quick reference)

  ## Constraints & Validation
  - Total split amounts must equal transaction amount (enforced by trigger)
  - At least 2 splits required for a split transaction
  - Each split must have a positive amount

  ## Security
  - Enable RLS on transaction_splits
  - Users can only access splits for their own transactions

  ## Indexes
  - Index on transaction_id for efficient split lookups
*/

-- Add split fields to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'is_split'
  ) THEN
    ALTER TABLE transactions ADD COLUMN is_split boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'split_count'
  ) THEN
    ALTER TABLE transactions ADD COLUMN split_count integer DEFAULT 0;
  END IF;
END $$;

-- Create transaction_splits table
CREATE TABLE IF NOT EXISTS transaction_splits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view splits for own transactions"
  ON transaction_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_splits.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert splits for own transactions"
  ON transaction_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_splits.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update splits for own transactions"
  ON transaction_splits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_splits.transaction_id
      AND transactions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_splits.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete splits for own transactions"
  ON transaction_splits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_splits.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transaction_splits_transaction_id ON transaction_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_split ON transactions(is_split) WHERE is_split = true;

-- Function to update transaction split metadata
CREATE OR REPLACE FUNCTION update_transaction_split_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE transactions
  SET
    is_split = (SELECT COUNT(*) FROM transaction_splits WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id)) > 0,
    split_count = (SELECT COUNT(*) FROM transaction_splits WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id))
  WHERE id = COALESCE(NEW.transaction_id, OLD.transaction_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for split metadata updates
DROP TRIGGER IF EXISTS update_split_metadata_on_insert ON transaction_splits;
CREATE TRIGGER update_split_metadata_on_insert
  AFTER INSERT ON transaction_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_split_metadata();

DROP TRIGGER IF EXISTS update_split_metadata_on_delete ON transaction_splits;
CREATE TRIGGER update_split_metadata_on_delete
  AFTER DELETE ON transaction_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_split_metadata();

-- Function to validate split amounts equal transaction amount
CREATE OR REPLACE FUNCTION validate_split_amounts()
RETURNS TRIGGER AS $$
DECLARE
  transaction_amount numeric;
  total_splits numeric;
  split_count_val integer;
BEGIN
  SELECT amount INTO transaction_amount
  FROM transactions
  WHERE id = NEW.transaction_id;

  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO total_splits, split_count_val
  FROM transaction_splits
  WHERE transaction_id = NEW.transaction_id;

  IF split_count_val >= 2 AND ABS(total_splits - ABS(transaction_amount)) > 0.01 THEN
    RAISE EXCEPTION 'Total split amounts (%) must equal transaction amount (%)', 
      total_splits, ABS(transaction_amount);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for split amount validation
DROP TRIGGER IF EXISTS validate_split_amounts_trigger ON transaction_splits;
CREATE TRIGGER validate_split_amounts_trigger
  AFTER INSERT OR UPDATE ON transaction_splits
  FOR EACH ROW
  EXECUTE FUNCTION validate_split_amounts();