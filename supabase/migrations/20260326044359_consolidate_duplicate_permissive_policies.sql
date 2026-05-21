/*
  # Consolidate Duplicate Permissive Policies

  ## Summary
  Resolves "Multiple Permissive Policies" warnings by consolidating overlapping
  SELECT/INSERT/UPDATE policies into single unified policies per action.

  The pattern used:
  - Where an ALL policy + a SELECT policy both exist for authenticated users,
    we merge them: the SELECT condition becomes (user_condition OR admin_condition)
  - This eliminates the duplicate evaluation overhead

  ## Tables Fixed
  - app_features
  - billing_history
  - faq_articles
  - feature_tier_config
  - quiz_questions
  - subscription_tiers
  - support_tickets
  - system_settings
  - ticket_messages
  - user_profiles
  - user_subscriptions
*/

-- =============================================
-- app_features
-- Duplicate: "Anyone can view active features" (SELECT) + "Super admins can manage features" (ALL includes SELECT)
-- Fix: merge into single SELECT that covers both cases
-- =============================================
DROP POLICY IF EXISTS "Anyone can view active features" ON public.app_features;
ALTER POLICY "Super admins can manage features" ON public.app_features
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );

-- =============================================
-- billing_history
-- Duplicate: "Admins can view all billing history" + "Users can view own billing history" both SELECT
-- Fix: merge into single SELECT policy
-- =============================================
DROP POLICY IF EXISTS "Admins can view all billing history" ON public.billing_history;
DROP POLICY IF EXISTS "Users can view own billing history" ON public.billing_history;
CREATE POLICY "Users can view own billing history"
  ON public.billing_history FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND (user_profiles.is_admin = true OR user_profiles.admin_role IS NOT NULL)
    )
  );

-- =============================================
-- faq_articles
-- Duplicate: "Admins can manage FAQ articles" (ALL) + "Anyone can view published FAQ articles" (SELECT)
-- Fix: merge SELECT condition into the ALL policy's USING
-- =============================================
DROP POLICY IF EXISTS "Anyone can view published FAQ articles" ON public.faq_articles;
ALTER POLICY "Admins can manage FAQ articles" ON public.faq_articles
  USING (
    is_published = true
    OR is_admin_user((select auth.uid()))
  )
  WITH CHECK (
    is_admin_user((select auth.uid()))
  );

-- =============================================
-- feature_tier_config
-- Duplicate: "Anyone can view feature tier config" (SELECT, USING true) + "Super admins can manage feature tier config" (ALL)
-- Fix: the SELECT is public (true), so keep public SELECT and restrict writes to super admins
-- Convert ALL to separate INSERT/UPDATE/DELETE to avoid SELECT duplicate
-- =============================================
DROP POLICY IF EXISTS "Anyone can view feature tier config" ON public.feature_tier_config;
DROP POLICY IF EXISTS "Super admins can manage feature tier config" ON public.feature_tier_config;
CREATE POLICY "Anyone can view feature tier config"
  ON public.feature_tier_config FOR SELECT
  USING (true);
CREATE POLICY "Super admins can insert feature tier config"
  ON public.feature_tier_config FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );
CREATE POLICY "Super admins can update feature tier config"
  ON public.feature_tier_config FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );
CREATE POLICY "Super admins can delete feature tier config"
  ON public.feature_tier_config FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );

-- =============================================
-- quiz_questions
-- Duplicate: "Admins can manage quiz questions" (ALL) + "Anyone can view active quiz questions" (SELECT)
-- Fix: merge SELECT into USING of the ALL policy
-- =============================================
DROP POLICY IF EXISTS "Anyone can view active quiz questions" ON public.quiz_questions;
ALTER POLICY "Admins can manage quiz questions" ON public.quiz_questions
  USING (
    is_active = true
    OR is_admin_user((select auth.uid()))
  )
  WITH CHECK (
    is_admin_user((select auth.uid()))
  );

-- =============================================
-- subscription_tiers
-- Duplicate: "Admins can update subscription tiers" (ALL) + "Public can view active subscription tiers" (SELECT)
-- Fix: split ALL into separate operations, keep public SELECT separate
-- =============================================
DROP POLICY IF EXISTS "Admins can update subscription tiers" ON public.subscription_tiers;
DROP POLICY IF EXISTS "Public can view active subscription tiers" ON public.subscription_tiers;
CREATE POLICY "Anyone can view active subscription tiers"
  ON public.subscription_tiers FOR SELECT
  USING (is_active = true OR is_admin_user((select auth.uid())));
CREATE POLICY "Admins can insert subscription tiers"
  ON public.subscription_tiers FOR INSERT TO authenticated
  WITH CHECK (is_admin_user((select auth.uid())));
CREATE POLICY "Admins can update subscription tiers"
  ON public.subscription_tiers FOR UPDATE TO authenticated
  USING (is_admin_user((select auth.uid())))
  WITH CHECK (is_admin_user((select auth.uid())));
CREATE POLICY "Admins can delete subscription tiers"
  ON public.subscription_tiers FOR DELETE TO authenticated
  USING (is_admin_user((select auth.uid())));

-- =============================================
-- support_tickets
-- Duplicate SELECT: "Admins can view all support tickets" + "Users can view own tickets"
-- Duplicate UPDATE: "Admins can update any support ticket" + "Users can update own tickets"
-- Fix: merge into single SELECT and single UPDATE
-- =============================================
DROP POLICY IF EXISTS "Admins can view all support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR is_admin_user((select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can update any support ticket" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
CREATE POLICY "Users can update own tickets"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR is_admin_user((select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR is_admin_user((select auth.uid()))
  );

-- =============================================
-- system_settings
-- Duplicate SELECT: "Admins can view system settings" + "Super admins can modify system settings" (ALL) + "Authenticated users can read stripe environment"
-- Fix: The ALL policy covers SELECT for super admins; merge admin SELECT into it,
-- keep the public stripe environment one separate but non-overlapping
-- Convert ALL to explicit INSERT/UPDATE/DELETE so SELECT is handled once
-- =============================================
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can modify system settings" ON public.system_settings;
CREATE POLICY "Admins can view system settings"
  ON public.system_settings FOR SELECT TO authenticated
  USING (
    (setting_key = 'stripe_environment' AND is_sensitive = false)
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
    )
  );
DROP POLICY IF EXISTS "Authenticated users can read stripe environment" ON public.system_settings;
CREATE POLICY "Super admins can insert system settings"
  ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );
CREATE POLICY "Super admins can update system settings"
  ON public.system_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );
CREATE POLICY "Super admins can delete system settings"
  ON public.system_settings FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true
      AND user_profiles.admin_role = 'super_admin'
    )
  );

-- =============================================
-- ticket_messages
-- Duplicate INSERT: "Admins can reply to any ticket" + "Users can insert messages for own tickets"
-- Duplicate SELECT: "Admins can view all ticket messages" + "Users can view messages for own tickets"
-- Fix: merge each pair into a single policy
-- =============================================
DROP POLICY IF EXISTS "Admins can reply to any ticket" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can insert messages for own tickets" ON public.ticket_messages;
CREATE POLICY "Users can insert messages for own tickets"
  ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE support_tickets.id = ticket_messages.ticket_id
        AND support_tickets.user_id = (select auth.uid())
      )
      OR is_admin_user((select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Admins can view all ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can view messages for own tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for own tickets"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = (select auth.uid())
    )
    OR is_admin_user((select auth.uid()))
  );

-- =============================================
-- user_profiles
-- Duplicate DELETE: "Admins can delete any profile" + "Users can delete own profile"
-- Duplicate INSERT: "Admins can insert any profile" + "Users can insert own profile"
-- Duplicate SELECT: "Admins can view all profiles" + "Users can view own profile"
-- Duplicate UPDATE: "Admins can update all profiles" + "Users can update own profile"
-- Fix: merge each pair
-- =============================================
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles FOR DELETE TO authenticated
  USING (
    (select auth.uid()) = id
    OR is_admin_user((select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can insert any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = id
    OR is_admin_user((select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = id
    OR is_admin_user((select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = id
    OR is_admin_user((select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR is_admin_user((select auth.uid()))
  );

-- =============================================
-- user_subscriptions
-- Duplicate INSERT: "Admins can manage user subscriptions" (ALL) + "Users can insert own subscriptions"
-- Duplicate SELECT: "Admins can manage user subscriptions" (ALL) + "Users can view own subscriptions"
-- Duplicate UPDATE: "Admins can manage user subscriptions" (ALL) + "Users can update own subscriptions"
-- Fix: split ALL into explicit ops that merge user + admin conditions
-- =============================================
DROP POLICY IF EXISTS "Admins can manage user subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR is_admin_user((select auth.uid()))
  );
CREATE POLICY "Users can insert own subscriptions"
  ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    OR is_admin_user((select auth.uid()))
  );
CREATE POLICY "Users can update own subscriptions"
  ON public.user_subscriptions FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR is_admin_user((select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR is_admin_user((select auth.uid()))
  );
CREATE POLICY "Admins can delete user subscriptions"
  ON public.user_subscriptions FOR DELETE TO authenticated
  USING (is_admin_user((select auth.uid())));
