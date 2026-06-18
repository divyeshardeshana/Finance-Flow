-- Add currency column to budgets table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'currency'
  ) THEN
    ALTER TABLE budgets ADD COLUMN currency text DEFAULT 'USD';
  END IF;
END $$;
