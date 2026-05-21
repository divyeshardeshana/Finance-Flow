/*
  # Fix Unindexed Foreign Keys - Batch 2

  ## Summary
  Adds covering indexes for all foreign key columns that were missing indexes.
  This improves query performance when joining or filtering on these columns.

  ## Tables Fixed
  - admin_activity_log: admin_user_id
  - ai_suggestions: user_id
  - assets: user_id
  - assistant_conversations: user_id
  - beneficiaries: user_id
  - bill_reminders: user_id
  - custom_payment_methods: user_id
  - estate_documents: user_id
  - feature_access_log: user_id
  - feature_tier_config: tier_id
  - goal_milestones: goal_id
  - insurance_policies: beneficiary_id, user_id
  - liabilities: user_id
  - price_comparisons: product_category_id, store_id
  - recurring_transactions: user_id
  - retirement_accounts: user_id
  - retirement_projections: user_id
  - savings_goals: user_id
  - support_tickets: assigned_admin_id, user_id
  - ticket_messages: ticket_id
  - transaction_splits: transaction_id
  - transactions: recurring_transaction_id, user_id
  - user_achievements: user_id
  - user_quiz_attempts: user_id
*/

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON public.admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON public.ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON public.assistant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON public.beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_user_id ON public.bill_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_payment_methods_user_id ON public.custom_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_estate_documents_user_id ON public.estate_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_log_user_id ON public.feature_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_tier_config_tier_id ON public.feature_tier_config(tier_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON public.goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_beneficiary_id ON public.insurance_policies(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON public.insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON public.liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_price_comparisons_product_category_id ON public.price_comparisons(product_category_id);
CREATE INDEX IF NOT EXISTS idx_price_comparisons_store_id ON public.price_comparisons(store_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_retirement_accounts_user_id ON public.retirement_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_retirement_projections_user_id ON public.retirement_projections(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_admin_id ON public.support_tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_transaction_id ON public.transaction_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_transaction_id ON public.transactions(recurring_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_id ON public.user_quiz_attempts(user_id);
