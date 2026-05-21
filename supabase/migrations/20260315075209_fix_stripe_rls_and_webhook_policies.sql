
/*
  # Fix Stripe RLS Policies and Webhook Log

  ## Summary
  Fixes several critical RLS policy gaps that prevent the Stripe integration from working:

  1. stripe_webhooks_log — Add UPDATE policy for service role so the webhook handler
     can update event status from 'processing' to 'processed' or 'failed'

  2. system_settings — Add a limited public SELECT policy so authenticated users can
     read the stripe_environment setting (needed by SubscriptionManagementPage)

  3. stripe_payment_history — Ensure service role can insert/update payment records

  4. billing_history — Ensure service role DELETE is allowed for cleanup operations

  ## Critical Fix
  Without the stripe_webhooks_log UPDATE policy, the webhook function can INSERT
  new events (status=processing) but silently fails to update them to 'processed',
  causing all webhook events to appear stuck in processing state even when handled.
*/

-- Fix stripe_webhooks_log: add UPDATE policy for service role
CREATE POLICY "Service role can update webhook log"
  ON stripe_webhooks_log
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix system_settings: allow authenticated users to read non-sensitive stripe_environment
-- This is needed so the frontend can show/hide the test mode banner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'system_settings' AND policyname = 'Authenticated users can read stripe environment'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can read stripe environment"
        ON system_settings
        FOR SELECT
        TO authenticated
        USING (setting_key = 'stripe_environment' AND is_sensitive = false)
    $policy$;
  END IF;
END $$;

-- Ensure billing_history has a DELETE policy for service role (for dedup cleanup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'billing_history' AND policyname = 'Service role can delete billing history'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can delete billing history"
        ON billing_history
        FOR DELETE
        TO service_role
        USING (true)
    $policy$;
  END IF;
END $$;

-- Ensure stripe_payment_history has service role policies if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stripe_payment_history') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'stripe_payment_history' AND policyname = 'Service role can manage payment history'
    ) THEN
      EXECUTE $policy$
        CREATE POLICY "Service role can manage payment history"
          ON stripe_payment_history
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true)
      $policy$;
    END IF;
  END IF;
END $$;
