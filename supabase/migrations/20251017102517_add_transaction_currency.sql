/*
  # Add Currency Field to Transactions

  ## Changes
  1. Add `currency` column to transactions table
     - Stores the currency code (USD, EUR, INR, etc.) for each transaction
     - Defaults to NULL (will use user's profile currency if not specified)
  
  ## Purpose
  This allows transactions to maintain their original currency rather than being converted.
  When displaying, we'll show the amount in the currency it was entered in.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'currency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN currency text;
  END IF;
END $$;