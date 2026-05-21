/*
  # Fix Stripe Schema and Settings

  Adds missing Stripe columns to user_subscriptions and subscription_tiers,
  fixes settings, and adds performance indexes.
*/

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

UPDATE user_subscriptions us
SET tier = st.tier_name
FROM subscription_tiers st
WHERE us.tier_id = st.id
  AND (us.tier IS NULL OR us.tier = 'free');

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

UPDATE system_settings
SET setting_type = 'feature_flag'
WHERE setting_key = 'stripe_active_environment';

DELETE FROM system_settings
WHERE setting_key IN ('stripe_secret_key', 'stripe_publishable_key', 'stripe_webhook_secret')
  AND (setting_value IS NULL OR setting_value = '');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer
  ON user_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON user_profiles(stripe_customer_id);
