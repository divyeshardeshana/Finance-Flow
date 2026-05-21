/*
  # Add Retirement Planning System

  ## Overview
  Enables users to plan and track retirement accounts, projections, and goals.
  This is a Premium Plan feature for retirement readiness planning.

  ## New Tables Created

  ### 1. `retirement_accounts`
  Track retirement accounts:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `account_name` (text) - Name of retirement account
  - `account_type` (text) - 401k, ira_traditional, ira_roth, 403b, sep_ira, simple_ira, pension, other
  - `current_balance` (numeric) - Current account balance
  - `currency` (text) - Currency code
  - `employer_match` (numeric) - Employer match percentage
  - `annual_contribution` (numeric) - Annual contributions
  - `institution` (text) - Financial institution
  - `notes` (text) - Additional details
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `retirement_projections`
  Store retirement projection calculations:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `current_age` (integer) - User's current age
  - `retirement_age` (integer) - Target retirement age
  - `life_expectancy` (integer) - Expected lifespan
  - `current_savings` (numeric) - Total retirement savings now
  - `annual_contribution` (numeric) - Annual contribution amount
  - `expected_return_rate` (numeric) - Expected annual return %
  - `inflation_rate` (numeric) - Expected inflation rate %
  - `desired_annual_income` (numeric) - Desired annual retirement income
  - `projected_balance` (numeric) - Calculated projected balance at retirement
  - `monthly_income_at_retirement` (numeric) - Projected monthly income
  - `savings_gap` (numeric) - Shortfall or surplus
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own records

  ## Indexes
  - Index on user_id for efficient queries
*/

-- Create retirement_accounts table
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
  ON retirement_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own retirement accounts"
  ON retirement_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own retirement accounts"
  ON retirement_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own retirement accounts"
  ON retirement_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create retirement_projections table
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
  ON retirement_projections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own retirement projections"
  ON retirement_projections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own retirement projections"
  ON retirement_projections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own retirement projections"
  ON retirement_projections FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_retirement_accounts_user_id ON retirement_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_retirement_projections_user_id ON retirement_projections(user_id);

-- Function to calculate retirement projection
CREATE OR REPLACE FUNCTION calculate_retirement_projection(
  current_age_param integer,
  retirement_age_param integer,
  life_expectancy_param integer,
  current_savings_param numeric,
  annual_contribution_param numeric,
  expected_return_param numeric,
  inflation_param numeric,
  desired_income_param numeric
) RETURNS TABLE(
  projected_balance numeric,
  monthly_income numeric,
  savings_gap numeric
) AS $$
DECLARE
  years_to_retirement integer;
  years_in_retirement integer;
  future_value numeric;
  withdrawal_rate numeric := 0.04;
  sustainable_income numeric;
BEGIN
  years_to_retirement := retirement_age_param - current_age_param;
  years_in_retirement := life_expectancy_param - retirement_age_param;
  
  future_value := current_savings_param * power(1 + (expected_return_param / 100.0), years_to_retirement);
  
  IF years_to_retirement > 0 AND expected_return_param > 0 THEN
    future_value := future_value + (annual_contribution_param * ((power(1 + (expected_return_param / 100.0), years_to_retirement) - 1) / (expected_return_param / 100.0)));
  END IF;
  
  sustainable_income := future_value * withdrawal_rate;
  
  RETURN QUERY SELECT
    future_value as projected_balance,
    (sustainable_income / 12.0) as monthly_income,
    (desired_income_param - sustainable_income) as savings_gap;
END;
$$ LANGUAGE plpgsql;