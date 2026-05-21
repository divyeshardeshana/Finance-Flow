/*
  # Add currency column to bill_reminders

  Adds `currency` (text, default 'USD') to bill_reminders table.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bill_reminders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE bill_reminders ADD COLUMN currency text DEFAULT 'USD' NOT NULL;
  END IF;
END $$;
