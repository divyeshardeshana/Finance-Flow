/*
  # Remove Stripe Integration

  ## Summary
  Removes all Stripe-related tables, columns, and settings from the database.

  ## Changes

  ### Tables Dropped
  - `stripe_payment_history` - Stripe invoice/payment records
  - `stripe_webhooks_log` - Stripe webhook event idempotency log

  ### Columns Removed from `user_profiles`
  - `stripe_customer_id`

  ### Columns Removed from `user_subscriptions`
  - `stripe_customer_id`, `stripe_price_id`, `stripe_subscription_id`
  - `billing_cycle`, `is_trial`, `cancelled_at`

  ### Columns Removed from `subscription_tiers`
  - `stripe_price_id_monthly`, `stripe_price_id_annual`

  ### Settings Deleted from `system_settings`
  - All stripe_* keys (6 API key settings + environment toggle)
*/

DROP TABLE IF EXISTS stripe_payment_history CASCADE;
DROP TABLE IF EXISTS stripe_webhooks_log CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE user_profiles DROP COLUMN stripe_customer_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE user_subscriptions DROP COLUMN stripe_customer_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_price_id') THEN
    ALTER TABLE user_subscriptions DROP COLUMN stripe_price_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE user_subscriptions DROP COLUMN stripe_subscription_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'billing_cycle') THEN
    ALTER TABLE user_subscriptions DROP COLUMN billing_cycle;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'is_trial') THEN
    ALTER TABLE user_subscriptions DROP COLUMN is_trial;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'cancelled_at') THEN
    ALTER TABLE user_subscriptions DROP COLUMN cancelled_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_tiers' AND column_name = 'stripe_price_id_monthly') THEN
    ALTER TABLE subscription_tiers DROP COLUMN stripe_price_id_monthly;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_tiers' AND column_name = 'stripe_price_id_annual') THEN
    ALTER TABLE subscription_tiers DROP COLUMN stripe_price_id_annual;
  END IF;
END $$;

DELETE FROM system_settings
WHERE setting_key IN (
  'stripe_test_secret_key',
  'stripe_test_publishable_key',
  'stripe_test_webhook_secret',
  'stripe_production_secret_key',
  'stripe_production_publishable_key',
  'stripe_production_webhook_secret',
  'stripe_active_environment'
);
