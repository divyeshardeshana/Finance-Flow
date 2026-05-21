/*
  # Add currency column to budgets table

  ## Summary
  Adds a `currency` column to the `budgets` table so that budget amounts can be
  stored alongside the currency they were entered in. This enables proper currency
  conversion when displaying budget amounts in a different currency.

  ## Changes
  ### Modified Tables
  - `budgets`
    - Added `currency` (text, default 'AUD') — stores the currency the budget amount was entered in.
      Defaulting to 'AUD' since that was the application's previous default currency.

  ## Notes
  - Existing budgets without an explicit currency will default to 'AUD' (the prior app default).
  - New budgets will store the user's current currency at creation time.
  - This enables display-time conversion from stored currency to preferred display currency.
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
