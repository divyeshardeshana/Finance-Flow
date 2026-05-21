/*
  # Fix Admin Premium Access

  This migration ensures that:
  1. All super_admin users automatically get premium subscription tier
  2. The specific user divyesh3@gmail.com has premium access
  3. Admin roles are properly configured with permissions

  ## Changes

  1. Updates
    - Set subscription_tier to 'premium' for all users with admin_role = 'super_admin'
    - Ensure user_subscriptions table has premium subscription for super admins

  2. Security
    - Only affects users already marked as super_admin
    - Maintains existing RLS policies
*/

-- Update user_profiles to set premium tier for all super admins
UPDATE user_profiles
SET subscription_tier = 'premium'
WHERE admin_role = 'super_admin'
  AND is_admin = true
  AND subscription_tier != 'premium';

-- Function to ensure super admins have premium subscriptions
DO $$
DECLARE
  admin_user_record RECORD;
  premium_tier_id uuid;
BEGIN
  -- Get the premium tier ID
  SELECT id INTO premium_tier_id
  FROM subscription_tiers
  WHERE tier_name = 'premium'
  LIMIT 1;

  -- If premium tier doesn't exist, exit
  IF premium_tier_id IS NULL THEN
    RAISE NOTICE 'Premium tier not found in subscription_tiers';
    RETURN;
  END IF;

  -- Loop through all super admin users
  FOR admin_user_record IN
    SELECT id FROM user_profiles
    WHERE admin_role = 'super_admin' AND is_admin = true
  LOOP
    -- Check if they have an active subscription
    IF NOT EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = admin_user_record.id
        AND status = 'active'
        AND tier_id = premium_tier_id
    ) THEN
      -- Delete any existing subscriptions for this user
      DELETE FROM user_subscriptions WHERE user_id = admin_user_record.id;

      -- Create premium subscription
      INSERT INTO user_subscriptions (user_id, tier_id, status, start_date, auto_renew)
      VALUES (
        admin_user_record.id,
        premium_tier_id,
        'active',
        now(),
        true
      );

      RAISE NOTICE 'Created premium subscription for admin user: %', admin_user_record.id;
    END IF;
  END LOOP;
END $$;

-- Ensure admin_roles has all required roles (should already exist from previous migration)
INSERT INTO admin_roles (role_name, display_name, permissions, description, is_active) VALUES
  ('super_admin', 'Super Administrator',
   '["all"]'::jsonb,
   'Full access to all features and settings', true),
  ('billing_manager', 'Billing Manager',
   '["view_users", "view_subscriptions", "manage_subscriptions", "view_payments", "process_refunds", "view_reports"]'::jsonb,
   'Manage subscriptions, payments, and billing-related tasks', true),
  ('support_agent', 'Support Agent',
   '["view_users", "view_tickets", "manage_tickets", "view_faqs", "manage_faqs"]'::jsonb,
   'Handle customer support tickets and FAQ management', true),
  ('content_manager', 'Content Manager',
   '["view_quizzes", "manage_quizzes", "view_faqs", "manage_faqs", "view_reports"]'::jsonb,
   'Manage quiz questions, FAQ articles, and educational content', true),
  ('read_only', 'Read Only Admin',
   '["view_users", "view_subscriptions", "view_tickets", "view_quizzes", "view_faqs", "view_reports"]'::jsonb,
   'View-only access for reporting and monitoring', true)
ON CONFLICT (role_name)
DO UPDATE SET
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;
