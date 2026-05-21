/*
  # Fix RLS Auth Performance - Part 1: Simple User-Owned Tables

  ## Summary
  Replaces auth.uid() with (select auth.uid()) in RLS policies for simple user-owned tables.
  Uses ALTER POLICY for SELECT/UPDATE/DELETE, and DROP+CREATE for INSERT policies.
*/

-- currency_change_history
ALTER POLICY "Users can view own currency history" ON public.currency_change_history
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own currency history" ON public.currency_change_history;
CREATE POLICY "Users can insert own currency history"
  ON public.currency_change_history FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- categories
ALTER POLICY "Users can delete own categories" ON public.categories
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own categories" ON public.categories
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own categories and presets" ON public.categories
  USING ((select auth.uid()) = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- transaction_documents
ALTER POLICY "Users can delete own documents" ON public.transaction_documents
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own documents" ON public.transaction_documents
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own documents" ON public.transaction_documents
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own documents" ON public.transaction_documents;
CREATE POLICY "Users can insert own documents"
  ON public.transaction_documents FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- transactions
ALTER POLICY "Users can delete own transactions" ON public.transactions
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own transactions" ON public.transactions
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own transactions" ON public.transactions
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- investment_profiles
ALTER POLICY "Users can update own investment profile" ON public.investment_profiles
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own investment profile" ON public.investment_profiles
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own investment profile" ON public.investment_profiles;
CREATE POLICY "Users can insert own investment profile"
  ON public.investment_profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ai_suggestions
ALTER POLICY "Users can delete own AI suggestions" ON public.ai_suggestions
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own AI suggestions" ON public.ai_suggestions
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own AI suggestions" ON public.ai_suggestions
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own AI suggestions" ON public.ai_suggestions;
CREATE POLICY "Users can insert own AI suggestions"
  ON public.ai_suggestions FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- savings_goals
ALTER POLICY "Users can delete own savings goals" ON public.savings_goals
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own savings goals" ON public.savings_goals
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own savings goals" ON public.savings_goals
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own savings goals" ON public.savings_goals;
CREATE POLICY "Users can insert own savings goals"
  ON public.savings_goals FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- price_comparisons
ALTER POLICY "Users can delete own price comparisons" ON public.price_comparisons
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own price comparisons" ON public.price_comparisons
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own price comparisons" ON public.price_comparisons;
CREATE POLICY "Users can insert own price comparisons"
  ON public.price_comparisons FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- feature_usage
ALTER POLICY "Users can update own feature usage" ON public.feature_usage
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own feature usage" ON public.feature_usage
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own feature usage" ON public.feature_usage;
CREATE POLICY "Users can insert own feature usage"
  ON public.feature_usage FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- user_quiz_attempts
ALTER POLICY "Users can view own quiz attempts" ON public.user_quiz_attempts
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.user_quiz_attempts;
CREATE POLICY "Users can insert own quiz attempts"
  ON public.user_quiz_attempts FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- user_streaks
ALTER POLICY "Users can update own streaks" ON public.user_streaks
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own streaks" ON public.user_streaks
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own streaks" ON public.user_streaks;
CREATE POLICY "Users can insert own streaks"
  ON public.user_streaks FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- assistant_conversations
ALTER POLICY "Users can delete own conversations" ON public.assistant_conversations
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own conversation history" ON public.assistant_conversations
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.assistant_conversations;
CREATE POLICY "Users can insert own conversations"
  ON public.assistant_conversations FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- recurring_transactions
ALTER POLICY "Users can delete own recurring transactions" ON public.recurring_transactions
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own recurring transactions" ON public.recurring_transactions
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own recurring transactions" ON public.recurring_transactions
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own recurring transactions" ON public.recurring_transactions;
CREATE POLICY "Users can insert own recurring transactions"
  ON public.recurring_transactions FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- user_achievements
ALTER POLICY "Users can view own achievements" ON public.user_achievements
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- user_points
ALTER POLICY "Users can update own points" ON public.user_points
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own points" ON public.user_points
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own points" ON public.user_points;
CREATE POLICY "Users can insert own points"
  ON public.user_points FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- feature_access_log
ALTER POLICY "Users can view own access logs" ON public.feature_access_log
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own access logs" ON public.feature_access_log;
CREATE POLICY "Users can insert own access logs"
  ON public.feature_access_log FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- custom_transaction_types
ALTER POLICY "Users can delete own custom types" ON public.custom_transaction_types
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own custom types" ON public.custom_transaction_types
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own custom types" ON public.custom_transaction_types
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own custom types" ON public.custom_transaction_types;
CREATE POLICY "Users can insert own custom types"
  ON public.custom_transaction_types FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- bill_reminders
ALTER POLICY "Users can delete own bill reminders" ON public.bill_reminders
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own bill reminders" ON public.bill_reminders
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own bill reminders" ON public.bill_reminders
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own bill reminders" ON public.bill_reminders;
CREATE POLICY "Users can insert own bill reminders"
  ON public.bill_reminders FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- notification_preferences
ALTER POLICY "Users can update own notification preferences" ON public.notification_preferences
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own notification preferences" ON public.notification_preferences
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- liabilities
ALTER POLICY "Users can delete own liabilities" ON public.liabilities
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own liabilities" ON public.liabilities
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own liabilities" ON public.liabilities
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own liabilities" ON public.liabilities;
CREATE POLICY "Users can insert own liabilities"
  ON public.liabilities FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- assets
ALTER POLICY "Users can delete own assets" ON public.assets
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own assets" ON public.assets
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own assets" ON public.assets
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own assets" ON public.assets;
CREATE POLICY "Users can insert own assets"
  ON public.assets FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- net_worth_snapshots
ALTER POLICY "Users can delete own snapshots" ON public.net_worth_snapshots
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own snapshots" ON public.net_worth_snapshots
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own snapshots" ON public.net_worth_snapshots
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own snapshots" ON public.net_worth_snapshots;
CREATE POLICY "Users can insert own snapshots"
  ON public.net_worth_snapshots FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- retirement_accounts
ALTER POLICY "Users can delete own retirement accounts" ON public.retirement_accounts
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own retirement accounts" ON public.retirement_accounts
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own retirement accounts" ON public.retirement_accounts
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own retirement accounts" ON public.retirement_accounts;
CREATE POLICY "Users can insert own retirement accounts"
  ON public.retirement_accounts FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- insurance_policies
ALTER POLICY "Users can delete own insurance policies" ON public.insurance_policies
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own insurance policies" ON public.insurance_policies
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own insurance policies" ON public.insurance_policies
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own insurance policies" ON public.insurance_policies;
CREATE POLICY "Users can insert own insurance policies"
  ON public.insurance_policies FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- retirement_projections
ALTER POLICY "Users can delete own retirement projections" ON public.retirement_projections
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own retirement projections" ON public.retirement_projections
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own retirement projections" ON public.retirement_projections
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own retirement projections" ON public.retirement_projections;
CREATE POLICY "Users can insert own retirement projections"
  ON public.retirement_projections FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- beneficiaries
ALTER POLICY "Users can delete own beneficiaries" ON public.beneficiaries
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own beneficiaries" ON public.beneficiaries
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own beneficiaries" ON public.beneficiaries
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own beneficiaries" ON public.beneficiaries;
CREATE POLICY "Users can insert own beneficiaries"
  ON public.beneficiaries FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- estate_documents
ALTER POLICY "Users can delete own estate documents" ON public.estate_documents
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own estate documents" ON public.estate_documents
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own estate documents" ON public.estate_documents
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own estate documents" ON public.estate_documents;
CREATE POLICY "Users can insert own estate documents"
  ON public.estate_documents FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- budgets
ALTER POLICY "Users can delete own budgets" ON public.budgets
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own budgets" ON public.budgets
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own budgets" ON public.budgets
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- custom_payment_methods
ALTER POLICY "Users can delete own payment methods" ON public.custom_payment_methods
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own payment methods" ON public.custom_payment_methods
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own payment methods" ON public.custom_payment_methods
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.custom_payment_methods;
CREATE POLICY "Users can insert own payment methods"
  ON public.custom_payment_methods FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- login_history
ALTER POLICY "Users can view own login history" ON public.login_history
  USING ((select auth.uid()) = user_id);

-- stripe_customers
ALTER POLICY "Users can view their own customer data" ON public.stripe_customers
  USING ((user_id = (select auth.uid())) AND (deleted_at IS NULL));

-- stripe_subscriptions
ALTER POLICY "Users can view their own subscription data" ON public.stripe_subscriptions
  USING (
    (customer_id IN (
      SELECT stripe_customers.customer_id FROM stripe_customers
      WHERE (stripe_customers.user_id = (select auth.uid())) AND (stripe_customers.deleted_at IS NULL)
    ))
    AND (deleted_at IS NULL)
  );

-- stripe_orders
ALTER POLICY "Users can view their own order data" ON public.stripe_orders
  USING (
    (customer_id IN (
      SELECT stripe_customers.customer_id FROM stripe_customers
      WHERE (stripe_customers.user_id = (select auth.uid())) AND (stripe_customers.deleted_at IS NULL)
    ))
    AND (deleted_at IS NULL)
  );

-- user_profiles - own policies
ALTER POLICY "Users can delete own profile" ON public.user_profiles
  USING ((select auth.uid()) = id);
ALTER POLICY "Users can update own profile" ON public.user_profiles
  USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
ALTER POLICY "Users can view own profile" ON public.user_profiles
  USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- billing_history
ALTER POLICY "Users can view own billing history" ON public.billing_history
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Admins can view all billing history" ON public.billing_history
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND (user_profiles.is_admin = true OR user_profiles.admin_role IS NOT NULL)
    )
  );
