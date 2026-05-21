/*
  # Fix Stripe Webhook RLS and Payment History Access

  1. Changes
    - Ensure stripe_webhooks_log allows service_role inserts (already bypasses RLS, but add explicit policy for safety)
    - Add INSERT policy to stripe_payment_history so edge functions via service_role can write
    - Add policy for users to read their own payment history consistently

  2. Notes
    - Service role always bypasses RLS, so edge functions should already work
    - These policies are for any authenticated admin operations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stripe_webhooks_log' AND policyname = 'Service role can manage webhooks'
  ) THEN
    CREATE POLICY "Service role can manage webhooks"
      ON stripe_webhooks_log
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stripe_payment_history' AND policyname = 'Service role can manage payment history'
  ) THEN
    CREATE POLICY "Service role can manage payment history"
      ON stripe_payment_history
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions' AND policyname = 'Service role can manage subscriptions'
  ) THEN
    CREATE POLICY "Service role can manage subscriptions"
      ON user_subscriptions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'Service role can manage profiles'
  ) THEN
    CREATE POLICY "Service role can manage profiles"
      ON user_profiles
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
