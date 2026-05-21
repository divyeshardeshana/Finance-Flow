/*
  # Fix Duplicate Index and Drop Unused Indexes

  ## Summary
  1. Removes the duplicate index idx_user_subscriptions_stripe_sub_id (keeping idx_user_subscriptions_stripe_sub)
  2. Drops all unused indexes to reduce storage overhead and write amplification

  ## Notes
  - Unused indexes add overhead on writes without benefiting reads
  - The duplicate stripe subscription indexes are identical; one is removed
*/

-- Drop duplicate index (keep idx_user_subscriptions_stripe_sub)
DROP INDEX IF EXISTS public.idx_user_subscriptions_stripe_sub_id;

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_currency_change_history_changed_at;
DROP INDEX IF EXISTS public.idx_bill_reminders_user_id;
DROP INDEX IF EXISTS public.idx_bill_reminders_next_due_date;
DROP INDEX IF EXISTS public.idx_bill_reminders_active;
DROP INDEX IF EXISTS public.idx_notification_preferences_user_id;
DROP INDEX IF EXISTS public.idx_transaction_splits_transaction_id;
DROP INDEX IF EXISTS public.idx_transactions_is_split;
DROP INDEX IF EXISTS public.idx_savings_goals_user_id;
DROP INDEX IF EXISTS public.idx_transactions_user_id;
DROP INDEX IF EXISTS public.idx_transactions_category;
DROP INDEX IF EXISTS public.idx_budgets_user_month;
DROP INDEX IF EXISTS public.idx_price_comparisons_store;
DROP INDEX IF EXISTS public.idx_price_comparisons_category;
DROP INDEX IF EXISTS public.idx_ai_suggestions_user_status;
DROP INDEX IF EXISTS public.idx_assistant_conversations_user_date;
DROP INDEX IF EXISTS public.idx_user_quiz_attempts_user_id;
DROP INDEX IF EXISTS public.idx_user_quiz_attempts_completed;
DROP INDEX IF EXISTS public.idx_user_streaks_user_id;
DROP INDEX IF EXISTS public.idx_recurring_transactions_user_next;
DROP INDEX IF EXISTS public.idx_transactions_recurring_id;
DROP INDEX IF EXISTS public.idx_user_achievements_user_id;
DROP INDEX IF EXISTS public.idx_quiz_questions_category;
DROP INDEX IF EXISTS public.idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS public.idx_custom_transaction_types_user_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_status;
DROP INDEX IF EXISTS public.idx_subscription_tiers_tier_name;
DROP INDEX IF EXISTS public.idx_feature_access_log_user_id;
DROP INDEX IF EXISTS public.idx_support_tickets_user_id;
DROP INDEX IF EXISTS public.idx_ticket_messages_ticket_id;
DROP INDEX IF EXISTS public.idx_faq_articles_category;
DROP INDEX IF EXISTS public.idx_goal_milestones_goal_id;
DROP INDEX IF EXISTS public.idx_assets_user_id;
DROP INDEX IF EXISTS public.idx_liabilities_user_id;
DROP INDEX IF EXISTS public.idx_net_worth_snapshots_user_id;
DROP INDEX IF EXISTS public.idx_retirement_accounts_user_id;
DROP INDEX IF EXISTS public.idx_retirement_projections_user_id;
DROP INDEX IF EXISTS public.idx_beneficiaries_user_id;
DROP INDEX IF EXISTS public.idx_insurance_policies_user_id;
DROP INDEX IF EXISTS public.idx_insurance_policies_beneficiary;
DROP INDEX IF EXISTS public.idx_estate_documents_user_id;
DROP INDEX IF EXISTS public.idx_estate_documents_review_date;
DROP INDEX IF EXISTS public.idx_custom_payment_methods_user_id;
DROP INDEX IF EXISTS public.idx_admin_activity_log_admin_user;
DROP INDEX IF EXISTS public.idx_admin_activity_log_target;
DROP INDEX IF EXISTS public.idx_support_tickets_assigned;
DROP INDEX IF EXISTS public.idx_faq_articles_slug;
DROP INDEX IF EXISTS public.idx_app_features_category;
DROP INDEX IF EXISTS public.idx_app_features_active;
DROP INDEX IF EXISTS public.idx_feature_tier_config_tier;
DROP INDEX IF EXISTS public.idx_user_profiles_email;
DROP INDEX IF EXISTS public.idx_blog_posts_slug;
DROP INDEX IF EXISTS public.idx_billing_history_payment_date;
DROP INDEX IF EXISTS public.idx_user_subscriptions_stripe_sub;
DROP INDEX IF EXISTS public.idx_user_profiles_stripe_customer;
