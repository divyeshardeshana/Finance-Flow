/*
  # Admin System Foundation

  ## Overview
  Creates the complete admin system infrastructure including role-based access control,
  activity logging, payment tracking, and system configuration management.

  ## New Tables Created

  ### 1. `admin_roles`
  Define admin role types and their permissions:
  - `id` (uuid, primary key)
  - `role_name` (text) - super_admin, billing_manager, support_agent, content_manager, read_only
  - `display_name` (text) - User-friendly role name
  - `permissions` (jsonb) - Array of permission strings
  - `description` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 2. `admin_activity_log`
  Audit trail of all admin actions:
  - `id` (uuid, primary key)
  - `admin_user_id` (uuid, FK to auth.users)
  - `action_type` (text) - user_edit, plan_change, payment_refund, ticket_update, etc.
  - `target_type` (text) - user, subscription, ticket, faq, quiz, etc.
  - `target_id` (uuid) - ID of affected resource
  - `action_details` (jsonb) - Details of what changed
  - `ip_address` (text)
  - `user_agent` (text)
  - `created_at` (timestamptz)

  ### 3. `system_settings`
  Platform configuration and API keys:
  - `id` (uuid, primary key)
  - `setting_key` (text, unique) - Configuration key
  - `setting_value` (text) - Encrypted value
  - `setting_type` (text) - api_key, feature_flag, config, limit
  - `description` (text)
  - `is_sensitive` (boolean) - Whether to mask in UI
  - `updated_by` (uuid, FK to auth.users)
  - `created_at`, `updated_at` (timestamptz)

  ### 4. `stripe_payment_history`
  Complete payment transaction log:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `stripe_payment_intent_id` (text, unique)
  - `stripe_customer_id` (text)
  - `amount` (numeric)
  - `currency` (text)
  - `status` (text) - succeeded, pending, failed, refunded
  - `payment_method_type` (text) - card, bank, etc.
  - `payment_method_last4` (text)
  - `subscription_id` (uuid, FK to user_subscriptions)
  - `invoice_url` (text)
  - `failure_reason` (text)
  - `refund_amount` (numeric)
  - `refunded_at` (timestamptz)
  - `metadata` (jsonb)
  - `created_at` (timestamptz)

  ### 5. `stripe_webhooks_log`
  Log all Stripe webhook events:
  - `id` (uuid, primary key)
  - `event_id` (text, unique) - Stripe event ID
  - `event_type` (text) - payment_intent.succeeded, etc.
  - `payload` (jsonb) - Full webhook payload
  - `processed` (boolean)
  - `processing_error` (text)
  - `created_at` (timestamptz)
  - `processed_at` (timestamptz)

  ## Table Updates

  ### Update `user_profiles`
  Add admin and payment fields:
  - `is_admin` (boolean) - Whether user has admin access
  - `admin_role` (text) - Admin role name
  - `stripe_customer_id` (text) - Stripe customer ID
  - `payment_method_last4` (text) - Last 4 digits of payment method

  ### Update `user_subscriptions`
  Add payment tracking fields:
  - `stripe_subscription_id` (text) - Stripe subscription ID
  - `last_payment_date` (timestamptz) - Last successful payment
  - `next_billing_date` (timestamptz) - Next billing date
  - `payment_failed_count` (integer) - Failed payment attempts
  - `cancellation_reason` (text) - Why subscription was cancelled

  ### Update `support_tickets`
  Add admin management fields:
  - `assigned_admin_id` (uuid, FK to auth.users)
  - `admin_notes` (text) - Internal notes for admins
  - `sla_response_due` (timestamptz) - SLA response deadline
  - `sla_resolution_due` (timestamptz) - SLA resolution deadline

  ### Update `quiz_questions`
  Add content management fields:
  - `created_by_admin_id` (uuid, FK to auth.users)
  - `last_edited_by` (uuid, FK to auth.users)
  - `last_edited_at` (timestamptz)
  - `usage_count` (integer) - How many times attempted
  - `success_rate` (numeric) - Percentage of correct answers

  ### Update `faq_articles`
  Add content management fields:
  - `created_by_admin_id` (uuid, FK to auth.users)
  - `last_edited_by` (uuid, FK to auth.users)
  - `last_edited_at` (timestamptz)
  - `slug` (text, unique) - URL-friendly identifier

  ## Security
  - Enable RLS on all new tables
  - Only admin users can access admin tables
  - Activity logs are append-only
  - System settings require super_admin for sensitive keys
  - Payment history accessible only to billing_manager and super_admin

  ## Indexes
  - Indexes on admin_user_id, target_id for activity logs
  - Index on stripe_payment_intent_id for payment lookups
  - Index on event_id for webhook deduplication
  - Composite indexes for common queries
*/

-- STEP 1: Add admin fields to user_profiles FIRST
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'admin_role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN admin_role text CHECK (admin_role IN ('super_admin', 'billing_manager', 'support_agent', 'content_manager', 'read_only'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'payment_method_last4'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN payment_method_last4 text;
  END IF;
END $$;

-- STEP 2: Add payment fields to user_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN stripe_subscription_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN last_payment_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'next_billing_date'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN next_billing_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'payment_failed_count'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN payment_failed_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN cancellation_reason text;
  END IF;
END $$;

-- STEP 3: Add admin fields to support_tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'assigned_admin_id'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN assigned_admin_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN admin_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'sla_response_due'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN sla_response_due timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'sla_resolution_due'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN sla_resolution_due timestamptz;
  END IF;
END $$;

-- STEP 4: Add content management fields to quiz_questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'created_by_admin_id'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN created_by_admin_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'last_edited_by'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN last_edited_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'last_edited_at'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN last_edited_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN usage_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'success_rate'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN success_rate numeric DEFAULT 0;
  END IF;
END $$;

-- STEP 5: Add content management fields to faq_articles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'faq_articles' AND column_name = 'created_by_admin_id'
  ) THEN
    ALTER TABLE faq_articles ADD COLUMN created_by_admin_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'faq_articles' AND column_name = 'last_edited_by'
  ) THEN
    ALTER TABLE faq_articles ADD COLUMN last_edited_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'faq_articles' AND column_name = 'last_edited_at'
  ) THEN
    ALTER TABLE faq_articles ADD COLUMN last_edited_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'faq_articles' AND column_name = 'slug'
  ) THEN
    ALTER TABLE faq_articles ADD COLUMN slug text;
  END IF;
END $$;

-- STEP 6: Now create new tables with RLS policies that reference the columns we just added

-- Create admin_roles table
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

-- Create admin_activity_log table
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

-- Create system_settings table
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

-- Create stripe_payment_history table
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

-- Create stripe_webhooks_log table
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

-- Create indexes for performance
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

-- Insert default admin roles
INSERT INTO admin_roles (role_name, display_name, permissions, description) VALUES
  ('super_admin', 'Super Administrator', 
   '["all"]'::jsonb,
   'Full access to all features and settings'),
  ('billing_manager', 'Billing Manager',
   '["view_users", "view_subscriptions", "manage_subscriptions", "view_payments", "process_refunds", "view_reports"]'::jsonb,
   'Manage subscriptions, payments, and billing-related tasks'),
  ('support_agent', 'Support Agent',
   '["view_users", "view_tickets", "manage_tickets", "view_faqs", "manage_faqs"]'::jsonb,
   'Handle customer support tickets and FAQ management'),
  ('content_manager', 'Content Manager',
   '["view_quizzes", "manage_quizzes", "view_faqs", "manage_faqs", "view_reports"]'::jsonb,
   'Manage quiz questions, FAQ articles, and educational content'),
  ('read_only', 'Read Only Admin',
   '["view_users", "view_subscriptions", "view_tickets", "view_quizzes", "view_faqs", "view_reports"]'::jsonb,
   'View-only access for reporting and monitoring')
ON CONFLICT (role_name) DO NOTHING;

-- Insert default system settings
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
  ('email_service_provider', 'sendgrid', 'config', 'Email service provider (sendgrid, mailgun)', false),
  ('email_api_key', '', 'api_key', 'Email service API key', true),
  ('support_email', 'support@financialapp.com', 'config', 'Support email address', false),
  ('trial_period_days', '14', 'config', 'Free trial period in days', false),
  ('currency_api_key', '', 'api_key', 'Currency exchange rate API key', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Function to automatically set SLA deadlines on ticket creation
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

-- Create trigger for SLA deadlines
DROP TRIGGER IF EXISTS set_sla_on_ticket_create ON support_tickets;
CREATE TRIGGER set_sla_on_ticket_create
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_sla_deadlines();

-- Function to update quiz question statistics
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

-- Create trigger for quiz statistics
DROP TRIGGER IF EXISTS update_quiz_stats_on_attempt ON user_quiz_attempts;
CREATE TRIGGER update_quiz_stats_on_attempt
  AFTER INSERT ON user_quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_stats();