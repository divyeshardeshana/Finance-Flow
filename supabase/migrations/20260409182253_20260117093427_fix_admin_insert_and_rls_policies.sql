/*
  # Fix Admin User Creation and Loading Issues
  
  1. Changes Made
    - Add INSERT policy for admins to create user profiles for other users
    - Fix circular RLS dependency by ensuring is_admin_user() function properly bypasses RLS
    - Recreate is_admin_user function with proper SQL implementation
    - Add all necessary admin policies
  
  2. Security
    - Maintains proper authentication checks
    - Ensures only admins can create profiles for others
    - Preserves existing user self-management policies
  
  3. Important Notes
    - This fixes the "Error loading users" issue in admin panel
    - Enables admins to create new users through the admin interface
    - Removes circular dependency that was causing policy evaluation failures
*/

-- Drop existing is_admin_user function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS is_admin_user(uuid) CASCADE;

-- Recreate is_admin_user function with proper SQL implementation
-- This function bypasses RLS since it uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM user_profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;

-- Drop and recreate all user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON user_profiles;

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins can insert any profile (NEW - this was missing!)
CREATE POLICY "Admins can insert any profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Users can delete own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Admins can delete any profile
CREATE POLICY "Admins can delete any profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- Drop and recreate support_tickets policies
DROP POLICY IF EXISTS "Users can view own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update any support ticket" ON support_tickets;

CREATE POLICY "Users can view own support tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Users can create support tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any support ticket"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Drop and recreate ticket_messages policies
DROP POLICY IF EXISTS "Users can view own ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can view all ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can reply to own tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can reply to any ticket" ON ticket_messages;

CREATE POLICY "Users can view own ticket messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all ticket messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Users can reply to own tickets"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can reply to any ticket"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- Drop and recreate stripe_payment_history policies
DROP POLICY IF EXISTS "Users can view own payments" ON stripe_payment_history;
DROP POLICY IF EXISTS "Admins can view all payments" ON stripe_payment_history;
DROP POLICY IF EXISTS "Admins can manage payments" ON stripe_payment_history;

CREATE POLICY "Users can view own payments"
  ON stripe_payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON stripe_payment_history
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage payments"
  ON stripe_payment_history
  FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Drop and recreate subscription_tiers policies
DROP POLICY IF EXISTS "Anyone can view active subscription tiers" ON subscription_tiers;
DROP POLICY IF EXISTS "Admins can view all subscription tiers" ON subscription_tiers;
DROP POLICY IF EXISTS "Admins can update subscription tiers" ON subscription_tiers;

CREATE POLICY "Anyone can view active subscription tiers"
  ON subscription_tiers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all subscription tiers"
  ON subscription_tiers
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update subscription tiers"
  ON subscription_tiers
  FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Drop and recreate user_subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all user subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage user subscriptions" ON user_subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage user subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Drop and recreate faq_articles policies
DROP POLICY IF EXISTS "Anyone can view published FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can view all FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can manage FAQ articles" ON faq_articles;

CREATE POLICY "Anyone can view published FAQ articles"
  ON faq_articles
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can view all FAQ articles"
  ON faq_articles
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage FAQ articles"
  ON faq_articles
  FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Drop and recreate quiz_questions policies
DROP POLICY IF EXISTS "Users can view active quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can view all quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON quiz_questions;

CREATE POLICY "Users can view active quiz questions"
  ON quiz_questions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all quiz questions"
  ON quiz_questions
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage quiz questions"
  ON quiz_questions
  FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Recreate admin functions
DROP FUNCTION IF EXISTS get_users_for_admin(text, text, integer, integer);

CREATE OR REPLACE FUNCTION get_users_for_admin(
  search_term text DEFAULT '',
  filter_tier text DEFAULT 'all',
  offset_count integer DEFAULT 0,
  limit_count integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  subscription_tier text,
  is_admin boolean,
  admin_role text,
  created_at timestamp with time zone,
  photo_url text,
  country text,
  currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return user data
  RETURN QUERY
  SELECT
    up.id,
    up.full_name,
    au.email::text,
    up.subscription_tier,
    up.is_admin,
    up.admin_role,
    up.created_at,
    up.photo_url,
    up.country,
    up.currency
  FROM user_profiles up
  INNER JOIN auth.users au ON up.id = au.id
  WHERE
    (filter_tier = 'all' OR up.subscription_tier = filter_tier)
    AND (
      search_term = ''
      OR up.full_name ILIKE '%' || search_term || '%'
      OR au.email ILIKE '%' || search_term || '%'
      OR up.id::text ILIKE '%' || search_term || '%'
    )
  ORDER BY up.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

DROP FUNCTION IF EXISTS get_users_count_for_admin(text, text);

CREATE OR REPLACE FUNCTION get_users_count_for_admin(
  search_term text DEFAULT '',
  filter_tier text DEFAULT 'all'
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count bigint;
BEGIN
  -- Check if the caller is an admin
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get count
  SELECT COUNT(*)
  INTO user_count
  FROM user_profiles up
  INNER JOIN auth.users au ON up.id = au.id
  WHERE
    (filter_tier = 'all' OR up.subscription_tier = filter_tier)
    AND (
      search_term = ''
      OR up.full_name ILIKE '%' || search_term || '%'
      OR au.email ILIKE '%' || search_term || '%'
      OR up.id::text ILIKE '%' || search_term || '%'
    );

  RETURN user_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_for_admin(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_count_for_admin(text, text) TO authenticated;
