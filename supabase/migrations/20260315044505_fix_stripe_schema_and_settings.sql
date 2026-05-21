/*
  # Fix Stripe Schema and Settings

  ## Summary
  This migration fixes several issues with the Stripe integration:

  1. **user_subscriptions table** - Add missing columns:
     - `tier` (text) - Denormalized tier name for easy querying (synced from subscription_tiers)
     - `is_trial` (boolean) - Whether this is a trial subscription
     - `billing_cycle` (text) - 'monthly' or 'annual'
     - `stripe_customer_id` (text) - Stripe Customer object ID
     - `stripe_price_id` (text) - Stripe Price object ID used for this subscription

  2. **system_settings** - Fix the `stripe_active_environment` setting type from 'config'
     to 'feature_flag' so it renders as a dropdown in the admin UI. Also remove the
     legacy empty stripe_secret_key, stripe_publishable_key, and stripe_webhook_secret rows.

  3. **subscription_tiers** - Add `stripe_price_id_monthly` and `stripe_price_id_annual`
     columns so admins can link tiers to actual Stripe Price objects.

  ## Security
  - RLS remains enabled on all modified tables
  - No policy changes needed - existing policies cover new columns
*/

-- Add missing columns to user_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'tier'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN tier text DEFAULT 'free';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN is_trial boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN billing_cycle text DEFAULT 'monthly';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN stripe_price_id text;
  END IF;
END $$;

-- Backfill the tier column from subscription_tiers join
UPDATE user_subscriptions us
SET tier = st.tier_name
FROM subscription_tiers st
WHERE us.tier_id = st.id
  AND us.tier IS NULL OR us.tier = 'free';

-- Add stripe price columns to subscription_tiers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_tiers' AND column_name = 'stripe_price_id_monthly'
  ) THEN
    ALTER TABLE subscription_tiers ADD COLUMN stripe_price_id_monthly text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_tiers' AND column_name = 'stripe_price_id_annual'
  ) THEN
    ALTER TABLE subscription_tiers ADD COLUMN stripe_price_id_annual text;
  END IF;
END $$;

-- Fix stripe_active_environment setting type to render as dropdown
UPDATE system_settings
SET setting_type = 'feature_flag'
WHERE setting_key = 'stripe_active_environment';

-- Remove legacy empty stripe keys that cause confusion
DELETE FROM system_settings
WHERE setting_key IN ('stripe_secret_key', 'stripe_publishable_key', 'stripe_webhook_secret')
  AND (setting_value IS NULL OR setting_value = '');

-- Add stripe_customer_id column to user_profiles if not exists (for caching)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Add index on stripe_customer_id for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer
  ON user_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription
  ON user_subscriptions(stripe_subscription_id);

-- Add index on user_profiles stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON user_profiles(stripe_customer_id);
