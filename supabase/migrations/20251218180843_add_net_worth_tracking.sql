/*
  # Add Net Worth Tracking System

  ## Overview
  Enables users to track assets, liabilities, and net worth over time.
  This is a Premium Plan feature for comprehensive wealth management.

  ## New Tables Created

  ### 1. `assets`
  Track user assets:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `asset_name` (text) - Name of the asset
  - `asset_type` (text) - real_estate, investment, cash, retirement, vehicle, business, crypto, other
  - `current_value` (numeric) - Current market value
  - `currency` (text) - Currency code
  - `purchase_date` (date) - When asset was acquired
  - `purchase_price` (numeric) - Original purchase price
  - `notes` (text) - Additional details
  - `is_liquid` (boolean) - Whether easily convertible to cash
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `liabilities`
  Track user liabilities:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `liability_name` (text) - Name of the liability
  - `liability_type` (text) - mortgage, loan, credit_card, student_loan, auto_loan, other
  - `current_balance` (numeric) - Current outstanding balance
  - `currency` (text) - Currency code
  - `original_amount` (numeric) - Original loan/debt amount
  - `interest_rate` (numeric) - Annual interest rate
  - `monthly_payment` (numeric) - Regular monthly payment
  - `due_date` (date) - Final payoff date
  - `notes` (text) - Additional details
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `net_worth_snapshots`
  Historical net worth tracking:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `snapshot_date` (date) - Date of snapshot
  - `total_assets` (numeric) - Total asset value
  - `total_liabilities` (numeric) - Total liability value
  - `net_worth` (numeric) - Assets minus liabilities
  - `notes` (text) - Optional notes
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own records

  ## Indexes
  - Index on user_id for all tables
  - Index on snapshot_date for time-series queries
*/

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  asset_type text DEFAULT 'other' CHECK (asset_type IN ('real_estate', 'investment', 'cash', 'retirement', 'vehicle', 'business', 'crypto', 'other')),
  current_value numeric NOT NULL CHECK (current_value >= 0),
  currency text DEFAULT 'USD',
  purchase_date date,
  purchase_price numeric CHECK (purchase_price >= 0),
  notes text DEFAULT '',
  is_liquid boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create liabilities table
CREATE TABLE IF NOT EXISTS liabilities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liability_name text NOT NULL,
  liability_type text DEFAULT 'other' CHECK (liability_type IN ('mortgage', 'loan', 'credit_card', 'student_loan', 'auto_loan', 'other')),
  current_balance numeric NOT NULL CHECK (current_balance >= 0),
  currency text DEFAULT 'USD',
  original_amount numeric CHECK (original_amount >= 0),
  interest_rate numeric DEFAULT 0 CHECK (interest_rate >= 0),
  monthly_payment numeric DEFAULT 0 CHECK (monthly_payment >= 0),
  due_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own liabilities"
  ON liabilities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own liabilities"
  ON liabilities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own liabilities"
  ON liabilities FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own liabilities"
  ON liabilities FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create net_worth_snapshots table
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  total_assets numeric NOT NULL DEFAULT 0,
  total_liabilities numeric NOT NULL DEFAULT 0,
  net_worth numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON net_worth_snapshots FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own snapshots"
  ON net_worth_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own snapshots"
  ON net_worth_snapshots FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own snapshots"
  ON net_worth_snapshots FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_id ON net_worth_snapshots(user_id, snapshot_date DESC);

-- Function to calculate current net worth
CREATE OR REPLACE FUNCTION calculate_net_worth(user_id_param uuid)
RETURNS TABLE(
  total_assets numeric,
  total_liabilities numeric,
  net_worth numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(current_value) FROM assets WHERE user_id = user_id_param), 0) as total_assets,
    COALESCE((SELECT SUM(current_balance) FROM liabilities WHERE user_id = user_id_param), 0) as total_liabilities,
    COALESCE((SELECT SUM(current_value) FROM assets WHERE user_id = user_id_param), 0) -
    COALESCE((SELECT SUM(current_balance) FROM liabilities WHERE user_id = user_id_param), 0) as net_worth;
END;
$$ LANGUAGE plpgsql;

-- Function to create net worth snapshot
CREATE OR REPLACE FUNCTION create_net_worth_snapshot(user_id_param uuid, snapshot_date_param date)
RETURNS uuid AS $$
DECLARE
  snapshot_id uuid;
  calc_assets numeric;
  calc_liabilities numeric;
  calc_net_worth numeric;
BEGIN
  SELECT * INTO calc_assets, calc_liabilities, calc_net_worth
  FROM calculate_net_worth(user_id_param);
  
  INSERT INTO net_worth_snapshots (user_id, snapshot_date, total_assets, total_liabilities, net_worth)
  VALUES (user_id_param, snapshot_date_param, calc_assets, calc_liabilities, calc_net_worth)
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET
    total_assets = calc_assets,
    total_liabilities = calc_liabilities,
    net_worth = calc_net_worth
  RETURNING id INTO snapshot_id;
  
  RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;