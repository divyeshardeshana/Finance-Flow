/*
  # Add Extended Fields to Support Tickets

  Adds affected_area, steps_taken, contact_preference, and browser_os to support_tickets.
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
