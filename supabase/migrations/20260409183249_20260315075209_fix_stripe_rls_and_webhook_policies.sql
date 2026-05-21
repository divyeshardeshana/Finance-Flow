/*
  # Fix Stripe RLS Policies and Webhook Log

  Adds missing service_role policies and allows authenticated users to read stripe_environment.
*/

CREATE POLICY "Service role can update webhook log"
  ON stripe_webhooks_log
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

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
