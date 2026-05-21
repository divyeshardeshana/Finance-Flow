DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'comments'
  ) THEN
    ALTER TABLE budgets ADD COLUMN comments text DEFAULT '';
  END IF;
END $$;
