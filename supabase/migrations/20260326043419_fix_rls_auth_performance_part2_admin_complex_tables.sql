/*
  # Fix RLS Auth Performance - Part 2: Admin & Complex Tables + Consolidate Duplicates

  ## Summary
  1. Fixes auth.uid() re-evaluation in admin-related policies using (select auth.uid())
  2. Consolidates multiple duplicate permissive policies into single policies
*/

-- =============================================
-- SYSTEM SETTINGS
-- =============================================
ALTER POLICY "Admins can view system settings" ON public.system_settings
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true
    )
  );
ALTER POLICY "Super admins can modify system settings" ON public.system_settings
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'
    )
  );

-- =============================================
-- COUNTRY PLANS
-- =============================================
ALTER POLICY "Admins can delete retirement plans" ON public.country_retirement_plans
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
ALTER POLICY "Admins can update retirement plans" ON public.country_retirement_plans
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can insert retirement plans" ON public.country_retirement_plans;
CREATE POLICY "Admins can insert retirement plans" ON public.country_retirement_plans FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));

ALTER POLICY "Admins can delete investment plans" ON public.country_investment_plans
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
ALTER POLICY "Admins can update investment plans" ON public.country_investment_plans
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can insert investment plans" ON public.country_investment_plans;
CREATE POLICY "Admins can insert investment plans" ON public.country_investment_plans FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));

-- =============================================
-- SEO PAGES
-- =============================================
ALTER POLICY "Admins can delete seo_pages" ON public.seo_pages
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
ALTER POLICY "Admins can update seo_pages" ON public.seo_pages
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can insert seo_pages" ON public.seo_pages;
CREATE POLICY "Admins can insert seo_pages" ON public.seo_pages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));

-- =============================================
-- EMAIL TEMPLATES
-- =============================================
ALTER POLICY "Admins can delete email templates" ON public.email_templates
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
ALTER POLICY "Admins can update email templates" ON public.email_templates
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can insert email templates" ON public.email_templates;
CREATE POLICY "Admins can insert email templates" ON public.email_templates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));

-- =============================================
-- SYSTEM BACKUPS
-- =============================================
ALTER POLICY "Admins can delete system backups" ON public.system_backups
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
ALTER POLICY "Admins can update system backups" ON public.system_backups
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
ALTER POLICY "Admins can view system backups" ON public.system_backups
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can create system backups" ON public.system_backups;
CREATE POLICY "Admins can create system backups" ON public.system_backups FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));

-- =============================================
-- BLOG TABLES
-- =============================================
ALTER POLICY "Admins can delete blog categories" ON public.blog_categories
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
ALTER POLICY "Admins can update blog categories" ON public.blog_categories
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can insert blog categories" ON public.blog_categories;
CREATE POLICY "Admins can insert blog categories" ON public.blog_categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));

-- blog_posts: consolidate "Admins can read all blog posts" to include published check, drop "Anyone can read published blog posts"
ALTER POLICY "Admins can delete blog posts" ON public.blog_posts
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
ALTER POLICY "Admins can read all blog posts" ON public.blog_posts
  USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true)
  );
ALTER POLICY "Admins can update blog posts" ON public.blog_posts
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
CREATE POLICY "Admins can insert blog posts" ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));

-- =============================================
-- ADMIN ACTIVITY LOG
-- =============================================
ALTER POLICY "Admins can view activity logs" ON public.admin_activity_log
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_log;
CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_log FOR INSERT TO authenticated
  WITH CHECK (
    (admin_user_id = (select auth.uid()))
    AND EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true)
  );

-- =============================================
-- ADMIN ROLES
-- =============================================
ALTER POLICY "Only super admins can manage roles" ON public.admin_roles
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin')
  );

-- =============================================
-- APP FEATURES + FEATURE TIER CONFIG
-- =============================================
ALTER POLICY "Super admins can manage features" ON public.app_features
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'));

ALTER POLICY "Super admins can manage feature tier config" ON public.feature_tier_config
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'));

-- =============================================
-- HOMEPAGE CONTENT (consolidate duplicates)
-- =============================================
ALTER POLICY "Admins can manage homepage content" ON public.homepage_content
  USING (
    is_published = true
    OR EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = (select auth.uid()) AND user_profiles.is_admin = true)
  );
DROP POLICY IF EXISTS "Users can view published content" ON public.homepage_content;

-- =============================================
-- FAQ ARTICLES (consolidate duplicates)
-- =============================================
DROP POLICY IF EXISTS "Admins can view all FAQ articles" ON public.faq_articles;
ALTER POLICY "Admins can manage FAQ articles" ON public.faq_articles
  USING (is_admin_user((select auth.uid())))
  WITH CHECK (is_admin_user((select auth.uid())));

-- =============================================
-- QUIZ QUESTIONS (consolidate duplicates)
-- =============================================
DROP POLICY IF EXISTS "Admins can view all quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Users can view active quiz questions" ON public.quiz_questions;
ALTER POLICY "Admins can manage quiz questions" ON public.quiz_questions
  USING (is_admin_user((select auth.uid())))
  WITH CHECK (is_admin_user((select auth.uid())));

-- =============================================
-- SUBSCRIPTION TIERS (consolidate duplicates)
-- =============================================
DROP POLICY IF EXISTS "Admins can view all subscription tiers" ON public.subscription_tiers;
ALTER POLICY "Admins can update subscription tiers" ON public.subscription_tiers
  USING (is_admin_user((select auth.uid())))
  WITH CHECK (is_admin_user((select auth.uid())));

-- =============================================
-- USER PROFILES (consolidate duplicates)
-- =============================================
ALTER POLICY "Admins can delete any profile" ON public.user_profiles
  USING (is_admin_user((select auth.uid())));
ALTER POLICY "Admins can update all profiles" ON public.user_profiles
  USING (is_admin_user((select auth.uid())))
  WITH CHECK (is_admin_user((select auth.uid())));
ALTER POLICY "Admins can view all profiles" ON public.user_profiles
  USING (is_admin_user((select auth.uid())));
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.user_profiles;
CREATE POLICY "Admins can insert any profile" ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (is_admin_user((select auth.uid())));

-- =============================================
-- USER SUBSCRIPTIONS (consolidate duplicates)
-- =============================================
DROP POLICY IF EXISTS "Admins can view all user subscriptions" ON public.user_subscriptions;
ALTER POLICY "Admins can manage user subscriptions" ON public.user_subscriptions
  USING (is_admin_user((select auth.uid())))
  WITH CHECK (is_admin_user((select auth.uid())));
ALTER POLICY "Users can update own subscriptions" ON public.user_subscriptions
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own subscriptions" ON public.user_subscriptions
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- =============================================
-- SUPPORT TICKETS (consolidate duplicates)
-- =============================================
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
ALTER POLICY "Admins can update any support ticket" ON public.support_tickets
  USING (is_admin_user((select auth.uid())))
  WITH CHECK (is_admin_user((select auth.uid())));
ALTER POLICY "Admins can view all support tickets" ON public.support_tickets
  USING (is_admin_user((select auth.uid())));
ALTER POLICY "Users can update own tickets" ON public.support_tickets
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own tickets" ON public.support_tickets
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- =============================================
-- TICKET MESSAGES (consolidate duplicates)
-- =============================================
DROP POLICY IF EXISTS "Users can reply to own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can view own ticket messages" ON public.ticket_messages;
ALTER POLICY "Admins can view all ticket messages" ON public.ticket_messages
  USING (is_admin_user((select auth.uid())));
ALTER POLICY "Users can view messages for own tickets" ON public.ticket_messages
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = (select auth.uid())
    )
  );
DROP POLICY IF EXISTS "Admins can reply to any ticket" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can insert messages for own tickets" ON public.ticket_messages;
CREATE POLICY "Admins can reply to any ticket" ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (is_admin_user((select auth.uid())));
CREATE POLICY "Users can insert messages for own tickets" ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = (select auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = (select auth.uid())
    )
  );

-- =============================================
-- TRANSACTION SPLITS
-- =============================================
ALTER POLICY "Users can delete splits for own transactions" ON public.transaction_splits
  USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_splits.transaction_id AND t.user_id = (select auth.uid())));
ALTER POLICY "Users can update splits for own transactions" ON public.transaction_splits
  USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_splits.transaction_id AND t.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_splits.transaction_id AND t.user_id = (select auth.uid())));
ALTER POLICY "Users can view splits for own transactions" ON public.transaction_splits
  USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_splits.transaction_id AND t.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can insert splits for own transactions" ON public.transaction_splits;
CREATE POLICY "Users can insert splits for own transactions" ON public.transaction_splits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_splits.transaction_id AND t.user_id = (select auth.uid())));

-- =============================================
-- GOAL MILESTONES
-- =============================================
ALTER POLICY "Users can delete milestones for own goals" ON public.goal_milestones
  USING (EXISTS (SELECT 1 FROM public.savings_goals sg WHERE sg.id = goal_milestones.goal_id AND sg.user_id = (select auth.uid())));
ALTER POLICY "Users can update milestones for own goals" ON public.goal_milestones
  USING (EXISTS (SELECT 1 FROM public.savings_goals sg WHERE sg.id = goal_milestones.goal_id AND sg.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.savings_goals sg WHERE sg.id = goal_milestones.goal_id AND sg.user_id = (select auth.uid())));
ALTER POLICY "Users can view milestones for own goals" ON public.goal_milestones
  USING (EXISTS (SELECT 1 FROM public.savings_goals sg WHERE sg.id = goal_milestones.goal_id AND sg.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can insert milestones for own goals" ON public.goal_milestones;
CREATE POLICY "Users can insert milestones for own goals" ON public.goal_milestones FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.savings_goals sg WHERE sg.id = goal_milestones.goal_id AND sg.user_id = (select auth.uid())));
