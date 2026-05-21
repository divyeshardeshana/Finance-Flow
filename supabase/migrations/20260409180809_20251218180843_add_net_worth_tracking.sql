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
  ON assets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE TO authenticated USING (user_id = auth.uid());

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
  ON liabilities FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own liabilities"
  ON liabilities FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own liabilities"
  ON liabilities FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own liabilities"
  ON liabilities FOR DELETE TO authenticated USING (user_id = auth.uid());

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
  ON net_worth_snapshots FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own snapshots"
  ON net_worth_snapshots FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own snapshots"
  ON net_worth_snapshots FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own snapshots"
  ON net_worth_snapshots FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_id ON net_worth_snapshots(user_id, snapshot_date DESC);

CREATE OR REPLACE FUNCTION calculate_net_worth(user_id_param uuid)
RETURNS TABLE(total_assets numeric, total_liabilities numeric, net_worth numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(current_value) FROM assets WHERE user_id = user_id_param), 0),
    COALESCE((SELECT SUM(current_balance) FROM liabilities WHERE user_id = user_id_param), 0),
    COALESCE((SELECT SUM(current_value) FROM assets WHERE user_id = user_id_param), 0) -
    COALESCE((SELECT SUM(current_balance) FROM liabilities WHERE user_id = user_id_param), 0);
END;
$$ LANGUAGE plpgsql;
