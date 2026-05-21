/*
  # Add description and CTA text to subscription tiers

  1. Modified Tables
    - `subscription_tiers`
      - `description` (text) - Short description shown under price (e.g., "Perfect for getting started")
      - `cta_text` (text) - Call-to-action button text (e.g., "Get Started")

  2. Default Values
    - Free: "Perfect for getting started" / "Get Started"
    - Paid (Pro): "For serious financial planning" / "Get Started"
    - Premium: "Complete financial management" / "Get Started"

  3. Notes
    - These fields allow admins to edit all visible pricing card content from one place
    - Landing page will dynamically pull these values instead of hardcoding them
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_tiers' AND column_name = 'description'
  ) THEN
    ALTER TABLE subscription_tiers ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_tiers' AND column_name = 'cta_text'
  ) THEN
    ALTER TABLE subscription_tiers ADD COLUMN cta_text text DEFAULT 'Get Started';
  END IF;
END $$;

UPDATE subscription_tiers
SET description = 'Perfect for getting started', cta_text = 'Get Started'
WHERE tier_name = 'free' AND (description IS NULL OR description = '');

UPDATE subscription_tiers
SET description = 'For serious financial planning', cta_text = 'Get Started'
WHERE tier_name = 'paid' AND (description IS NULL OR description = '');

UPDATE subscription_tiers
SET description = 'Complete financial management', cta_text = 'Get Started'
WHERE tier_name = 'premium' AND (description IS NULL OR description = '');