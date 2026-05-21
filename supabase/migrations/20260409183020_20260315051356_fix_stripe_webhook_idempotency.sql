/*
  # Fix Stripe Webhook Idempotency and Billing History Schema

  Adds unique constraints and columns to harden the Stripe integration.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'stripe_webhooks_log' AND constraint_name = 'stripe_webhooks_log_event_id_key'
  ) THEN
    ALTER TABLE stripe_webhooks_log ADD CONSTRAINT stripe_webhooks_log_event_id_key UNIQUE (event_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_payment_history' AND column_name = 'stripe_invoice_id'
  ) THEN
    ALTER TABLE stripe_payment_history ADD COLUMN stripe_invoice_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'stripe_payment_history' AND indexname = 'stripe_payment_history_stripe_invoice_id_unique'
  ) THEN
    CREATE UNIQUE INDEX stripe_payment_history_stripe_invoice_id_unique
      ON stripe_payment_history (stripe_invoice_id)
      WHERE stripe_invoice_id IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'stripe_payment_history' AND indexname = 'idx_stripe_payment_history_user_created'
  ) THEN
    CREATE INDEX idx_stripe_payment_history_user_created
      ON stripe_payment_history (user_id, created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'user_subscriptions' AND indexname = 'idx_user_subscriptions_user_status'
  ) THEN
    CREATE INDEX idx_user_subscriptions_user_status
      ON user_subscriptions (user_id, status);
  END IF;
END $$;
