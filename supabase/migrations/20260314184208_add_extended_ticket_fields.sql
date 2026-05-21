/*
  # Add Extended Fields to Support Tickets

  ## Summary
  Enhances the support_tickets table with additional contextual fields to improve
  the support experience and help agents diagnose issues faster.

  ## New Columns

  ### support_tickets
  - `affected_area` (text, nullable) — Which area of the app is affected
    (e.g., dashboard, transactions, budget, goals, reports, billing, settings, other)
  - `steps_taken` (text, nullable) — What the user has already tried before submitting
  - `contact_preference` (text, nullable) — How the user prefers to be contacted
    (email, in_app). Defaults to 'email'
  - `browser_os` (text, nullable) — Browser/OS environment info, auto-captured on submit

  ## Notes
  - All new columns are optional (nullable) to keep backward compatibility
  - No changes to RLS policies needed as existing policies already cover all columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'affected_area'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN affected_area text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'steps_taken'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN steps_taken text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'contact_preference'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN contact_preference text DEFAULT 'email';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'browser_os'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN browser_os text DEFAULT NULL;
  END IF;
END $$;
