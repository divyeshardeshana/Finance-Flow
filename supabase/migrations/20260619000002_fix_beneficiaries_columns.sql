-- Add contingent column to beneficiaries (was in UI but missing from DB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beneficiaries' AND column_name = 'contingent'
  ) THEN
    ALTER TABLE beneficiaries ADD COLUMN contingent boolean DEFAULT false;
  END IF;
END $$;
