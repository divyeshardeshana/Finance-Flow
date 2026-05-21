/*
  # Add currency column to bill_reminders

  1. Modified Tables
    - `bill_reminders`
      - Added `currency` (text, default 'USD') - stores the currency used when the bill was created

  2. Notes
    - Existing bills default to USD
    - New bills will store the user's selected currency at creation time
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