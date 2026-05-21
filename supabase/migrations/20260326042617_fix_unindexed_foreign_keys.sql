/*
  # Fix Unindexed Foreign Keys

  ## Summary
  Adds covering indexes for all foreign key columns that were missing indexes.
  This improves query performance when joining or filtering on these columns.

  ## Tables Fixed
  - blog_posts: category_id, created_by, updated_by
  - categories: user_id
  - country_investment_plans: updated_by
  - country_retirement_plans: updated_by
  - faq_articles: created_by_admin_id, last_edited_by
  - homepage_content: updated_by
  - login_history: user_id
  - price_comparisons: user_id
  - product_categories: parent_category_id
  - quiz_questions: created_by_admin_id, last_edited_by
  - system_backups: created_by
  - system_settings: updated_by
  - ticket_messages: user_id
  - transaction_documents: user_id
  - transactions: document_id
  - user_quiz_attempts: quiz_question_id
  - user_subscriptions: tier_id
*/

CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by ON public.blog_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_blog_posts_updated_by ON public.blog_posts(updated_by);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

CREATE INDEX IF NOT EXISTS idx_country_investment_plans_updated_by ON public.country_investment_plans(updated_by);
CREATE INDEX IF NOT EXISTS idx_country_retirement_plans_updated_by ON public.country_retirement_plans(updated_by);

CREATE INDEX IF NOT EXISTS idx_faq_articles_created_by_admin_id ON public.faq_articles(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_faq_articles_last_edited_by ON public.faq_articles(last_edited_by);

CREATE INDEX IF NOT EXISTS idx_homepage_content_updated_by ON public.homepage_content(updated_by);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);

CREATE INDEX IF NOT EXISTS idx_price_comparisons_user_id ON public.price_comparisons(user_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_parent_category_id ON public.product_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_created_by_admin_id ON public.quiz_questions(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_last_edited_by ON public.quiz_questions(last_edited_by);

CREATE INDEX IF NOT EXISTS idx_system_backups_created_by ON public.system_backups(created_by);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON public.system_settings(updated_by);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_user_id ON public.ticket_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_documents_user_id ON public.transaction_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_document_id ON public.transactions(document_id);

CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_quiz_question_id ON public.user_quiz_attempts(quiz_question_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON public.user_subscriptions(tier_id);
