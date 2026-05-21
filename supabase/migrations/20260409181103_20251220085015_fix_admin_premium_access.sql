UPDATE user_profiles
SET subscription_tier = 'premium'
WHERE admin_role = 'super_admin' AND is_admin = true AND subscription_tier != 'premium';

DO $$
DECLARE
  admin_user_record RECORD;
  premium_tier_id uuid;
BEGIN
  SELECT id INTO premium_tier_id FROM subscription_tiers WHERE tier_name = 'premium' LIMIT 1;
  IF premium_tier_id IS NULL THEN RETURN; END IF;

  FOR admin_user_record IN
    SELECT id FROM user_profiles WHERE admin_role = 'super_admin' AND is_admin = true
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = admin_user_record.id AND status = 'active' AND tier_id = premium_tier_id
    ) THEN
      DELETE FROM user_subscriptions WHERE user_id = admin_user_record.id;
      INSERT INTO user_subscriptions (user_id, tier_id, status, start_date, auto_renew)
      VALUES (admin_user_record.id, premium_tier_id, 'active', now(), true);
    END IF;
  END LOOP;
END $$;

INSERT INTO admin_roles (role_name, display_name, permissions, description, is_active) VALUES
  ('super_admin', 'Super Administrator', '["all"]'::jsonb, 'Full access to all features and settings', true),
  ('billing_manager', 'Billing Manager', '["view_users", "view_subscriptions", "manage_subscriptions", "view_payments", "process_refunds", "view_reports"]'::jsonb, 'Manage subscriptions, payments, and billing-related tasks', true),
  ('support_agent', 'Support Agent', '["view_users", "view_tickets", "manage_tickets", "view_faqs", "manage_faqs"]'::jsonb, 'Handle customer support tickets and FAQ management', true),
  ('content_manager', 'Content Manager', '["view_quizzes", "manage_quizzes", "view_faqs", "manage_faqs", "view_reports"]'::jsonb, 'Manage quiz questions, FAQ articles, and educational content', true),
  ('read_only', 'Read Only Admin', '["view_users", "view_subscriptions", "view_tickets", "view_quizzes", "view_faqs", "view_reports"]'::jsonb, 'View-only access for reporting and monitoring', true)
ON CONFLICT (role_name) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;
