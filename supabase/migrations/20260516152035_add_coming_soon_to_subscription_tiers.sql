/*
  # Add coming_soon flag to subscription_tiers

  ## Summary
  Adds a `coming_soon` boolean column to `subscription_tiers` so admins can
  explicitly control which plans show a "Coming Soon" state in the UI, rather
  than having the frontend infer it from missing Stripe configuration.

  ## Changes
  - `subscription_tiers`: new column `coming_soon` (boolean, default false)
    - When true, the plan card shows a "Coming Soon" badge and the upgrade
      button is disabled with a friendly launch message.
    - When false (default), the upgrade flow proceeds normally and availability
      is determined by whether Stripe is configured.

  ## Notes
  - Existing plans default to `coming_soon = false` so behaviour is unchanged
    until an admin explicitly sets the flag.
  - The admin SubscriptionManagement panel already calls `updateSubscriptionPlan`
    which will automatically pass through this column once the type is updated.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_tiers' AND column_name = 'coming_soon'
  ) THEN
    ALTER TABLE subscription_tiers ADD COLUMN coming_soon boolean NOT NULL DEFAULT false;
  END IF;
END $$;
