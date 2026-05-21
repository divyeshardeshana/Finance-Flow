/*
  # Add Missing Admin Access Policies

  ## Overview
  Adds RLS policies to allow admin users to access and manage data in the admin panel.
  Uses DROP POLICY IF EXISTS to ensure idempotency.

  ## Tables Updated
  - support_tickets: Allow admins to view and update all tickets
  - ticket_messages: Allow admins to view and reply to all tickets
  - stripe_payment_history: Allow admins to update payment records
  - subscription_tiers: Allow admins to view all and update tiers
  - user_subscriptions: Allow admins full access
  - faq_articles: Allow admins full CRUD access
  - quiz_questions: Allow admins full CRUD access

  ## Security
  - All policies verify user has is_admin = true
*/

-- Drop existing policies if they exist to ensure clean state
DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update any support ticket" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can reply to any ticket" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can update payment records" ON stripe_payment_history;
DROP POLICY IF EXISTS "Admins can view all subscription tiers" ON subscription_tiers;
DROP POLICY IF EXISTS "Admins can update subscription tiers" ON subscription_tiers;
DROP POLICY IF EXISTS "Admins can view all user subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can update user subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can create user subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can update FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can create FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can delete FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can view all quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can update quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can create quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can delete quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;

-- Support Tickets: Admin access
CREATE POLICY "Admins can view all support tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update any support ticket"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Ticket Messages: Admin access
CREATE POLICY "Admins can view all ticket messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can reply to any ticket"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Payment History: Admin access
CREATE POLICY "Admins can update payment records"
  ON stripe_payment_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Subscription Tiers: Admin access
CREATE POLICY "Admins can view all subscription tiers"
  ON subscription_tiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update subscription tiers"
  ON subscription_tiers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- User Subscriptions: Admin access
CREATE POLICY "Admins can view all user subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update user subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can create user subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- FAQ Articles: Admin access
CREATE POLICY "Admins can view all FAQ articles"
  ON faq_articles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update FAQ articles"
  ON faq_articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can create FAQ articles"
  ON faq_articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete FAQ articles"
  ON faq_articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Quiz Questions: Admin access
CREATE POLICY "Admins can view all quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update quiz questions"
  ON quiz_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can create quiz questions"
  ON quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete quiz questions"
  ON quiz_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- User Profiles: Admin update access
CREATE POLICY "Admins can update user profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.is_admin = true
    )
  );