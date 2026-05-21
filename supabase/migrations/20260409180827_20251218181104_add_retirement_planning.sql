CREATE TABLE IF NOT EXISTS retirement_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  account_type text DEFAULT 'other' CHECK (account_type IN ('401k', 'ira_traditional', 'ira_roth', '403b', 'sep_ira', 'simple_ira', 'pension', 'other')),
  current_balance numeric NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  currency text DEFAULT 'USD',
  employer_match numeric DEFAULT 0 CHECK (employer_match >= 0 AND employer_match <= 100),
  annual_contribution numeric DEFAULT 0 CHECK (annual_contribution >= 0),
  institution text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE retirement_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own retirement accounts"
  ON retirement_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own retirement accounts"
  ON retirement_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own retirement accounts"
  ON retirement_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own retirement accounts"
  ON retirement_accounts FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS retirement_projections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_age integer NOT NULL CHECK (current_age >= 18 AND current_age <= 100),
  retirement_age integer NOT NULL CHECK (retirement_age >= 50 AND retirement_age <= 100),
  life_expectancy integer NOT NULL CHECK (life_expectancy >= 60 AND life_expectancy <= 120),
  current_savings numeric NOT NULL DEFAULT 0 CHECK (current_savings >= 0),
  annual_contribution numeric NOT NULL DEFAULT 0 CHECK (annual_contribution >= 0),
  expected_return_rate numeric NOT NULL DEFAULT 7 CHECK (expected_return_rate >= 0 AND expected_return_rate <= 30),
  inflation_rate numeric NOT NULL DEFAULT 3 CHECK (inflation_rate >= 0 AND inflation_rate <= 20),
  desired_annual_income numeric NOT NULL DEFAULT 0 CHECK (desired_annual_income >= 0),
  projected_balance numeric DEFAULT 0,
  monthly_income_at_retirement numeric DEFAULT 0,
  savings_gap numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE retirement_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own retirement projections"
  ON retirement_projections FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own retirement projections"
  ON retirement_projections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own retirement projections"
  ON retirement_projections FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own retirement projections"
  ON retirement_projections FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_retirement_accounts_user_id ON retirement_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_retirement_projections_user_id ON retirement_projections(user_id);
