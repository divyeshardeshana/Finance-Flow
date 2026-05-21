/*
  # Drop Unused Indexes - Batch 2

  ## Summary
  Drops indexes that have not been used by any queries.
  Unused indexes add write overhead without benefiting reads.

  ## Indexes Dropped
  - idx_system_backups_created_by
  - idx_system_settings_updated_by
  - idx_ticket_messages_user_id
  - idx_transaction_documents_user_id
  - idx_transactions_document_id
  - idx_user_quiz_attempts_quiz_question_id
  - idx_user_subscriptions_tier_id
  - idx_blog_posts_category_id
  - idx_blog_posts_created_by
  - idx_blog_posts_updated_by
  - idx_categories_user_id
  - idx_country_investment_plans_updated_by
  - idx_country_retirement_plans_updated_by
  - idx_faq_articles_created_by_admin_id
  - idx_faq_articles_last_edited_by
  - idx_homepage_content_updated_by
  - idx_login_history_user_id
  - idx_price_comparisons_user_id
  - idx_product_categories_parent_category_id
  - idx_quiz_questions_created_by_admin_id
  - idx_quiz_questions_last_edited_by
*/

DROP INDEX IF EXISTS public.idx_system_backups_created_by;
DROP INDEX IF EXISTS public.idx_system_settings_updated_by;
DROP INDEX IF EXISTS public.idx_ticket_messages_user_id;
DROP INDEX IF EXISTS public.idx_transaction_documents_user_id;
DROP INDEX IF EXISTS public.idx_transactions_document_id;
DROP INDEX IF EXISTS public.idx_user_quiz_attempts_quiz_question_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_tier_id;
DROP INDEX IF EXISTS public.idx_blog_posts_category_id;
DROP INDEX IF EXISTS public.idx_blog_posts_created_by;
DROP INDEX IF EXISTS public.idx_blog_posts_updated_by;
DROP INDEX IF EXISTS public.idx_categories_user_id;
DROP INDEX IF EXISTS public.idx_country_investment_plans_updated_by;
DROP INDEX IF EXISTS public.idx_country_retirement_plans_updated_by;
DROP INDEX IF EXISTS public.idx_faq_articles_created_by_admin_id;
DROP INDEX IF EXISTS public.idx_faq_articles_last_edited_by;
DROP INDEX IF EXISTS public.idx_homepage_content_updated_by;
DROP INDEX IF EXISTS public.idx_login_history_user_id;
DROP INDEX IF EXISTS public.idx_price_comparisons_user_id;
DROP INDEX IF EXISTS public.idx_product_categories_parent_category_id;
DROP INDEX IF EXISTS public.idx_quiz_questions_created_by_admin_id;
DROP INDEX IF EXISTS public.idx_quiz_questions_last_edited_by;
