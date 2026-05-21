-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('individual', 'family', 'freelancer', 'small_business')),
  average_monthly_income numeric DEFAULT 0,
  income_type text CHECK (income_type IN ('regular', 'irregular')),
  risk_tolerance text CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text DEFAULT 'circle',
  color text DEFAULT '#3B82F6',
  is_preset boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories and presets"
  ON categories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_preset = true);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create transaction_documents table
CREATE TABLE IF NOT EXISTS transaction_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  upload_status text DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
  extraction_status text,
  transactions_extracted integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON transaction_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON transaction_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON transaction_documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON transaction_documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  description text DEFAULT '',
  transaction_date date NOT NULL,
  payment_method text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  is_recurring boolean DEFAULT false,
  document_id uuid REFERENCES transaction_documents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL,
  budget_type text DEFAULT 'fixed_monthly' CHECK (budget_type IN ('fixed_monthly', 'rolling_average', 'adaptive')),
  month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, month)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  monthly_contribution numeric DEFAULT 0,
  target_date date,
  priority integer DEFAULT 1,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings goals"
  ON savings_goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own savings goals"
  ON savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own savings goals"
  ON savings_goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create investment_profiles table
CREATE TABLE IF NOT EXISTS investment_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score integer DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  recommended_stocks_percent numeric DEFAULT 0,
  recommended_bonds_percent numeric DEFAULT 0,
  recommended_cash_percent numeric DEFAULT 0,
  current_portfolio_value numeric DEFAULT 0,
  retirement_age integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE investment_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investment profile"
  ON investment_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own investment profile"
  ON investment_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own investment profile"
  ON investment_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create ai_suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('overspending', 'savings', 'investment', 'price_comparison')),
  category text,
  title text NOT NULL,
  description text NOT NULL,
  potential_savings numeric DEFAULT 0,
  status text DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'dismissed', 'completed')),
  created_at timestamptz DEFAULT now(),
  action_taken_at timestamptz
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own AI suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own AI suggestions"
  ON ai_suggestions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own AI suggestions"
  ON ai_suggestions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create stores table (public read access)
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  store_type text NOT NULL CHECK (store_type IN ('grocery', 'pharmacy', 'general', 'utility')),
  location text DEFAULT '',
  has_api boolean DEFAULT false,
  api_config jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stores"
  ON stores FOR SELECT
  TO authenticated
  USING (true);

-- Create product_categories table (public read access)
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  parent_category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  icon text DEFAULT 'shopping-bag',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product categories"
  ON product_categories FOR SELECT
  TO authenticated
  USING (true);

-- Create price_comparisons table
CREATE TABLE IF NOT EXISTS price_comparisons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  brand text DEFAULT '',
  price numeric NOT NULL,
  unit text DEFAULT 'per item',
  data_source text NOT NULL CHECK (data_source IN ('api', 'manual')),
  location text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE price_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all price comparisons"
  ON price_comparisons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own price comparisons"
  ON price_comparisons FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND data_source = 'manual');

CREATE POLICY "Users can update own price comparisons"
  ON price_comparisons FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND data_source = 'manual')
  WITH CHECK (user_id = auth.uid() AND data_source = 'manual');

CREATE POLICY "Users can delete own price comparisons"
  ON price_comparisons FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND data_source = 'manual');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_price_comparisons_store ON price_comparisons(store_id);
CREATE INDEX IF NOT EXISTS idx_price_comparisons_category ON price_comparisons(product_category_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_status ON ai_suggestions(user_id, status);

-- Insert preset expense categories
INSERT INTO categories (name, type, icon, color, is_preset) VALUES
  ('Groceries', 'expense', 'shopping-cart', '#10B981', true),
  ('Utilities', 'expense', 'zap', '#F59E0B', true),
  ('Rent/Mortgage', 'expense', 'home', '#EF4444', true),
  ('Transportation', 'expense', 'car', '#3B82F6', true),
  ('Food Delivery', 'expense', 'utensils', '#EC4899', true),
  ('Entertainment', 'expense', 'film', '#8B5CF6', true),
  ('Healthcare', 'expense', 'heart', '#14B8A6', true),
  ('Business Expenses', 'expense', 'briefcase', '#6366F1', true),
  ('Shopping', 'expense', 'shopping-bag', '#F97316', true),
  ('Subscriptions', 'expense', 'repeat', '#06B6D4', true)
ON CONFLICT DO NOTHING;

-- Insert preset income categories
INSERT INTO categories (name, type, icon, color, is_preset) VALUES
  ('Salary', 'income', 'dollar-sign', '#10B981', true),
  ('Freelance', 'income', 'briefcase', '#3B82F6', true),
  ('Investment', 'income', 'trending-up', '#8B5CF6', true),
  ('Other Income', 'income', 'plus-circle', '#6366F1', true)
ON CONFLICT DO NOTHING;

-- Insert sample stores
INSERT INTO stores (name, store_type, has_api) VALUES
  ('Walmart', 'grocery', false),
  ('Target', 'general', false),
  ('Kroger', 'grocery', false),
  ('Safeway', 'grocery', false),
  ('CVS', 'pharmacy', false),
  ('Walgreens', 'pharmacy', false),
  ('Costco', 'general', false),
  ('Whole Foods', 'grocery', false)
ON CONFLICT DO NOTHING;

-- Insert product categories
INSERT INTO product_categories (name, icon) VALUES
  ('Groceries', 'shopping-cart'),
  ('Dairy & Eggs', 'milk'),
  ('Meat & Seafood', 'beef'),
  ('Fruits & Vegetables', 'apple'),
  ('Bakery', 'cookie'),
  ('Beverages', 'coffee'),
  ('Household Essentials', 'home'),
  ('Personal Care', 'user'),
  ('Health & Medicine', 'heart'),
  ('Utilities', 'zap')
ON CONFLICT DO NOTHING;
