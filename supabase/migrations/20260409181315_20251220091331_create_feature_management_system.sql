CREATE TABLE IF NOT EXISTS app_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  route_path text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active features"
  ON app_features FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Super admins can manage features"
  ON app_features FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'));

CREATE TABLE IF NOT EXISTS feature_tier_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL REFERENCES app_features(feature_name) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(feature_name, tier_id)
);

ALTER TABLE feature_tier_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature tier config"
  ON feature_tier_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage feature tier config"
  ON feature_tier_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true AND user_profiles.admin_role = 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_app_features_category ON app_features(category);
CREATE INDEX IF NOT EXISTS idx_app_features_active ON app_features(is_active);
CREATE INDEX IF NOT EXISTS idx_feature_tier_config_feature ON feature_tier_config(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_tier_config_tier ON feature_tier_config(tier_id);

INSERT INTO app_features (feature_name, display_name, description, category, route_path, sort_order) VALUES
  ('basic_transactions', 'Basic Transactions', 'Track income and expenses with categories', 'Core Features', 'transactions', 1),
  ('basic_budget', 'Basic Budget', 'Create and monitor monthly budgets', 'Core Features', 'budget', 2),
  ('basic_reports', 'Basic Reports', 'View financial summaries and charts', 'Core Features', 'reports', 3),
  ('basic_investment', 'Basic Investment', 'Track investment portfolio basics', 'Core Features', 'investment', 4),
  ('financial_assistant', 'Financial Assistant', 'AI-powered financial advice and chat', 'AI Features', 'assistant', 5),
  ('literacy_gamification', 'Learning Challenges', 'Gamified financial literacy quizzes', 'Learning', 'literacy', 6),
  ('bill_reminders', 'Bill Reminders', 'Never miss a payment with automatic reminders', 'Premium Tools', 'bills', 10),
  ('split_transactions', 'Split Transactions', 'Split expenses across multiple categories', 'Premium Tools', null, 11),
  ('support_tickets', 'Priority Support', 'Access support ticketing system', 'Support', 'support', 12),
  ('advanced_goals', 'Advanced Goals', 'Set milestones and track multiple savings goals', 'Premium Tools', 'savings', 13),
  ('advanced_reports', 'Advanced Reports', 'Export reports to PDF, CSV, and Excel', 'Reports', 'reports', 14),
  ('net_worth_tracker', 'Net Worth Tracker', 'Track assets and liabilities with live updates', 'Advanced Planning', 'networth', 20),
  ('net_worth_tracking', 'Net Worth Tracking', 'Comprehensive net worth analysis', 'Advanced Planning', 'networth', 21),
  ('advanced_investments', 'Advanced Investments', 'Portfolio performance with benchmark comparisons', 'Advanced Planning', 'investment', 22),
  ('retirement_planning', 'Retirement Planning', 'Monte Carlo simulations for retirement', 'Advanced Planning', 'retirement', 23),
  ('estate_planning', 'Estate Planning', 'Document storage and beneficiary management', 'Advanced Planning', 'estate', 24),
  ('expense_predictions', 'Expense Predictions', 'AI-powered expense forecasting', 'AI Features', 'predictions', 30),
  ('stock_predictions', 'Stock Predictions', 'ML-based stock price predictions', 'AI Features', 'stockprediction', 31),
  ('ai_recommendations', 'AI Recommendations', 'Personalized financial recommendations', 'AI Features', 'recommendations', 32),
  ('price_comparison', 'Price Comparison', 'Compare prices across merchants', 'Shopping Tools', 'pricecomparison', 40)
ON CONFLICT (feature_name) DO NOTHING;

DO $$
DECLARE
  free_tier_id uuid;
  paid_tier_id uuid;
  premium_tier_id uuid;
BEGIN
  SELECT id INTO free_tier_id FROM subscription_tiers WHERE tier_name = 'free';
  SELECT id INTO paid_tier_id FROM subscription_tiers WHERE tier_name = 'paid';
  SELECT id INTO premium_tier_id FROM subscription_tiers WHERE tier_name = 'premium';

  INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled) VALUES
    ('basic_transactions', free_tier_id, true), ('basic_budget', free_tier_id, true),
    ('basic_reports', free_tier_id, true), ('basic_investment', free_tier_id, true),
    ('financial_assistant', free_tier_id, true), ('literacy_gamification', free_tier_id, true),
    ('expense_predictions', free_tier_id, true), ('stock_predictions', free_tier_id, true),
    ('ai_recommendations', free_tier_id, true), ('price_comparison', free_tier_id, true)
  ON CONFLICT (feature_name, tier_id) DO NOTHING;

  INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled) VALUES
    ('basic_transactions', paid_tier_id, true), ('basic_budget', paid_tier_id, true),
    ('basic_reports', paid_tier_id, true), ('basic_investment', paid_tier_id, true),
    ('financial_assistant', paid_tier_id, true), ('literacy_gamification', paid_tier_id, true),
    ('expense_predictions', paid_tier_id, true), ('stock_predictions', paid_tier_id, true),
    ('ai_recommendations', paid_tier_id, true), ('price_comparison', paid_tier_id, true),
    ('bill_reminders', paid_tier_id, true), ('split_transactions', paid_tier_id, true),
    ('support_tickets', paid_tier_id, true), ('advanced_goals', paid_tier_id, true),
    ('advanced_reports', paid_tier_id, true)
  ON CONFLICT (feature_name, tier_id) DO NOTHING;

  INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled) VALUES
    ('basic_transactions', premium_tier_id, true), ('basic_budget', premium_tier_id, true),
    ('basic_reports', premium_tier_id, true), ('basic_investment', premium_tier_id, true),
    ('financial_assistant', premium_tier_id, true), ('literacy_gamification', premium_tier_id, true),
    ('expense_predictions', premium_tier_id, true), ('stock_predictions', premium_tier_id, true),
    ('ai_recommendations', premium_tier_id, true), ('price_comparison', premium_tier_id, true),
    ('bill_reminders', premium_tier_id, true), ('split_transactions', premium_tier_id, true),
    ('support_tickets', premium_tier_id, true), ('advanced_goals', premium_tier_id, true),
    ('advanced_reports', premium_tier_id, true), ('net_worth_tracker', premium_tier_id, true),
    ('net_worth_tracking', premium_tier_id, true), ('advanced_investments', premium_tier_id, true),
    ('retirement_planning', premium_tier_id, true), ('estate_planning', premium_tier_id, true)
  ON CONFLICT (feature_name, tier_id) DO NOTHING;
END $$;
