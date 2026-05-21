/*
  # Add currency column to budgets table

  Adds `currency` column to budgets so budget amounts can be stored with their currency.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'currency'
  ) THEN
    ALTER TABLE budgets ADD COLUMN currency text DEFAULT 'AUD';
  END IF;
END $$;
