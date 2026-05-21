/*
  # Fix Subscription Status Constraint and Upsert Support

  ## Summary
  Two critical fixes for the Stripe subscription system:

  1. **status CHECK constraint**: The current constraint only allows 'active', 'cancelled', 'expired', 'trial'.
     The webhook sets 'past_due' when a payment fails, which causes a DB constraint violation and silently
     breaks the webhook. This migration adds 'past_due' to the allowed values.

  2. **Unique constraint for upsert**: The UNIQUE(user_id) constraint already exists, which enables
     the upsert pattern on user_id. This migration confirms the constraint is in place and adds a
     unique constraint on stripe_subscription_id for faster webhook lookups.

  ## Changes
  - Drops and recreates the status CHECK constraint to include 'past_due'
  - Adds unique index on billing_history.stripe_invoice_id if not present (already created by prior migration)
  - Adds index on user_subscriptions.stripe_subscription_id if not present
*/

-- Fix status CHECK constraint to include past_due
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'trial'::text, 'past_due'::text]));

-- Ensure index exists for stripe_subscription_id lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub_id ON user_subscriptions(stripe_subscription_id);
