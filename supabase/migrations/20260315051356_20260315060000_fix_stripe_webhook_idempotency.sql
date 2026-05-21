/*
  # Fix Stripe Webhook Idempotency and Billing History Schema

  ## Summary
  This migration hardens the Stripe integration by:
  1. Adding a unique constraint on stripe_webhooks_log.event_id to prevent duplicate processing
  2. Adding stripe_invoice_id column to stripe_payment_history for idempotent invoice tracking
  3. Adding unique constraint on stripe_invoice_id to prevent duplicate billing records on Stripe retries
  4. Adding cancelled_at column to user_subscriptions to track precise cancellation timestamp
  5. Adding performance indexes for common queries

  ## Changes

  ### stripe_webhooks_log
  - Add UNIQUE constraint on event_id to enforce idempotency

  ### stripe_payment_history
  - Add `stripe_invoice_id` (text, nullable) — Stripe invoice.id for deduplication
  - Add UNIQUE constraint on stripe_invoice_id to prevent duplicate billing rows

  ### user_subscriptions
  - Add `cancelled_at` (timestamptz, nullable) — precise cancellation timestamp

  ## Security
  - No RLS changes (tables already have appropriate policies)

  ## Notes
  - Uses IF NOT EXISTS / DO blocks for safe re-runs
  - Unique constraint on stripe_invoice_id uses a partial index to allow NULL values
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
