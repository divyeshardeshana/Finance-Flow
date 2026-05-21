/*
  # Add comments field to budgets table

  1. Changes
    - Add `comments` column to budgets table (optional text field)
    - Allows users to add notes or explanations for their budgets

  2. Security
    - No RLS changes needed, existing policies cover this column
*/

-- Add comments column to budgets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'comments'
  ) THEN
    ALTER TABLE budgets ADD COLUMN comments text DEFAULT '';
  END IF;
END $$;
