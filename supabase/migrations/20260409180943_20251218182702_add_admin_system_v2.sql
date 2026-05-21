DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'admin_role') THEN
    ALTER TABLE user_profiles ADD COLUMN admin_role text CHECK (admin_role IN ('super_admin', 'billing_manager', 'support_agent', 'content_manager', 'read_only'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'payment_method_last4') THEN
    ALTER TABLE user_profiles ADD COLUMN payment_method_last4 text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE user_subscriptions ADD COLUMN stripe_subscription_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'last_payment_date') THEN
    ALTER TABLE user_subscriptions ADD COLUMN last_payment_date timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'next_billing_date') THEN
    ALTER TABLE user_subscriptions ADD COLUMN next_billing_date timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'payment_failed_count') THEN
    ALTER TABLE user_subscriptions ADD COLUMN payment_failed_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE user_subscriptions ADD COLUMN cancellation_reason text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'assigned_admin_id') THEN
    ALTER TABLE support_tickets ADD COLUMN assigned_admin_id uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'admin_notes') THEN
    ALTER TABLE support_tickets ADD COLUMN admin_notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'sla_response_due') THEN
    ALTER TABLE support_tickets ADD COLUMN sla_response_due timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'sla_resolution_due') THEN
    ALTER TABLE support_tickets ADD COLUMN sla_resolution_due timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions' AND column_name = 'created_by_admin_id') THEN
    ALTER TABLE quiz_questions ADD COLUMN created_by_admin_id uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions' AND column_name = 'last_edited_by') THEN
    ALTER TABLE quiz_questions ADD COLUMN last_edited_by uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions' AND column_name = 'last_edited_at') THEN
    ALTER TABLE quiz_questions ADD COLUMN last_edited_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions' AND column_name = 'usage_count') THEN
    ALTER TABLE quiz_questions ADD COLUMN usage_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions' AND column_name = 'success_rate') THEN
    ALTER TABLE quiz_questions ADD COLUMN success_rate numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faq_articles' AND column_name = 'created_by_admin_id') THEN
    ALTER TABLE faq_articles ADD COLUMN created_by_admin_id uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faq_articles' AND column_name = 'last_edited_by') THEN
    ALTER TABLE faq_articles ADD COLUMN last_edited_by uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faq_articles' AND column_name = 'last_edited_at') THEN
    ALTER TABLE faq_articles ADD COLUMN last_edited_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faq_articles' AND column_name = 'slug') THEN
    ALTER TABLE faq_articles ADD COLUMN slug text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL CHECK (role_name IN ('super_admin', 'billing_manager', 'support_agent', 'content_manager', 'read_only')),
  display_name text NOT NULL,
  permissions jsonb DEFAULT '[]'::jsonb,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can manage roles"
  ON admin_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  action_details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  setting_type text NOT NULL CHECK (setting_type IN ('api_key', 'feature_flag', 'config', 'limit')),
  description text,
  is_sensitive boolean DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Super admins can modify system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );

CREATE TABLE IF NOT EXISTS stripe_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  stripe_customer_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending' CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded', 'partially_refunded')),
  payment_method_type text,
  payment_method_last4 text,
  subscription_id uuid REFERENCES user_subscriptions(id),
  invoice_url text,
  failure_reason text,
  refund_amount numeric DEFAULT 0,
  refunded_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stripe_payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment history"
  ON stripe_payment_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Billing admins can view all payments"
  ON stripe_payment_history FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role IN ('super_admin', 'billing_manager')
    )
  );

CREATE POLICY "Billing admins can manage payments"
  ON stripe_payment_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role IN ('super_admin', 'billing_manager')
    )
  );

CREATE TABLE IF NOT EXISTS stripe_webhooks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processing_error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE stripe_webhooks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can view webhooks"
  ON stripe_webhooks_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user ON admin_activity_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target ON admin_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_history_user ON stripe_payment_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_history_intent ON stripe_payment_history(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_history_customer ON stripe_payment_history(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event ON stripe_webhooks_log(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON stripe_webhooks_log(processed, created_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON user_profiles(is_admin, admin_role) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_admin_id, status);
CREATE INDEX IF NOT EXISTS idx_faq_articles_slug ON faq_articles(slug);

INSERT INTO admin_roles (role_name, display_name, permissions, description) VALUES
  ('super_admin', 'Super Administrator', '["all"]'::jsonb, 'Full access to all features and settings'),
  ('billing_manager', 'Billing Manager', '["view_users", "view_subscriptions", "manage_subscriptions", "view_payments", "process_refunds", "view_reports"]'::jsonb, 'Manage subscriptions, payments, and billing-related tasks'),
  ('support_agent', 'Support Agent', '["view_users", "view_tickets", "manage_tickets", "view_faqs", "manage_faqs"]'::jsonb, 'Handle customer support tickets and FAQ management'),
  ('content_manager', 'Content Manager', '["view_quizzes", "manage_quizzes", "view_faqs", "manage_faqs", "view_reports"]'::jsonb, 'Manage quiz questions, FAQ articles, and educational content'),
  ('read_only', 'Read Only Admin', '["view_users", "view_subscriptions", "view_tickets", "view_quizzes", "view_faqs", "view_reports"]'::jsonb, 'View-only access for reporting and monitoring')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive) VALUES
  ('stripe_publishable_key', '', 'api_key', 'Stripe publishable API key', false),
  ('stripe_secret_key', '', 'api_key', 'Stripe secret API key', true),
  ('stripe_webhook_secret', '', 'api_key', 'Stripe webhook signing secret', true),
  ('openai_api_key', '', 'api_key', 'OpenAI API key for financial assistant', true),
  ('openai_model', 'gpt-4', 'config', 'OpenAI model to use', false),
  ('openai_temperature', '0.7', 'config', 'OpenAI temperature setting', false),
  ('max_file_upload_mb', '10', 'limit', 'Maximum file upload size in MB', false),
  ('rate_limit_per_minute', '60', 'limit', 'API rate limit per user per minute', false),
  ('maintenance_mode', 'false', 'feature_flag', 'Enable maintenance mode', false),
  ('email_service_provider', 'sendgrid', 'config', 'Email service provider', false),
  ('email_api_key', '', 'api_key', 'Email service API key', true),
  ('support_email', 'support@financialapp.com', 'config', 'Support email address', false),
  ('trial_period_days', '14', 'config', 'Free trial period in days', false),
  ('currency_api_key', '', 'api_key', 'Currency exchange rate API key', true)
ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION set_ticket_sla_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_response_due IS NULL THEN
    IF NEW.priority IN ('high', 'urgent') THEN
      NEW.sla_response_due = NEW.created_at + INTERVAL '24 hours';
      NEW.sla_resolution_due = NEW.created_at + INTERVAL '3 days';
    ELSE
      NEW.sla_response_due = NEW.created_at + INTERVAL '48 hours';
      NEW.sla_resolution_due = NEW.created_at + INTERVAL '7 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_sla_on_ticket_create ON support_tickets;
CREATE TRIGGER set_sla_on_ticket_create
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_sla_deadlines();

CREATE OR REPLACE FUNCTION update_quiz_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quiz_questions
  SET 
    usage_count = usage_count + 1,
    success_rate = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE is_correct = true)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
        2
      )
      FROM user_quiz_attempts
      WHERE quiz_question_id = NEW.quiz_question_id
    )
  WHERE id = NEW.quiz_question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quiz_stats_on_attempt ON user_quiz_attempts;
CREATE TRIGGER update_quiz_stats_on_attempt
  AFTER INSERT ON user_quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_stats();
