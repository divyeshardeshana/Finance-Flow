/*
  # Stripe Integration v2 - Clean Rebuild

  Rebuilds Stripe integration from scratch with billing_history and stripe_webhooks_log tables.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN stripe_subscription_id text;
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
    WHERE table_name = 'user_subscriptions' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'next_billing_date'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN next_billing_date timestamptz;
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'paid',
  invoice_url text,
  invoice_pdf text,
  payment_date timestamptz,
  plan_name text,
  billing_cycle text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing history"
  ON billing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all billing history"
  ON billing_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.is_admin = true OR user_profiles.admin_role IS NOT NULL)
    )
  );

CREATE POLICY "Service role can insert billing history"
  ON billing_history FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update billing history"
  ON billing_history FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS stripe_webhooks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'processed'
);

ALTER TABLE stripe_webhooks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert webhook log"
  ON stripe_webhooks_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read webhook log"
  ON stripe_webhooks_log FOR SELECT
  TO service_role
  USING (true);

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
VALUES
  ('stripe_environment', 'test', 'config', 'Active Stripe environment (test or production)', false),
  ('stripe_test_publishable_key', '', 'api_key', 'Stripe test publishable key (pk_test_...)', false),
  ('stripe_test_secret_key', '', 'api_key', 'Stripe test secret key (sk_test_...)', true),
  ('stripe_test_webhook_secret', '', 'api_key', 'Stripe test webhook signing secret (whsec_...)', true),
  ('stripe_live_publishable_key', '', 'api_key', 'Stripe live publishable key (pk_live_...)', false),
  ('stripe_live_secret_key', '', 'api_key', 'Stripe live secret key (sk_live_...)', true),
  ('stripe_live_webhook_secret', '', 'api_key', 'Stripe live webhook signing secret (whsec_...)', true)
ON CONFLICT (setting_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_payment_date ON billing_history(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
