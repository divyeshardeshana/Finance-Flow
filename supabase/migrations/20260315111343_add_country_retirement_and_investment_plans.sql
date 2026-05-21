/*
  # Add Country Retirement Plans and Country Investment Plans

  ## Summary
  Creates two new tables that allow admins to configure up to 5 named/described
  retirement or investment plans per country. These plans are then surfaced to users
  on the Retirement Planning and Investment pages based on their profile country.

  ## New Tables

  ### country_retirement_plans
  - `id` (uuid, PK)
  - `country_code` (text, unique) — ISO country code matching user_profiles.country
  - `plan_1_name` through `plan_5_name` (text, nullable) — Plan display names
  - `plan_1_description` through `plan_5_description` (text, nullable) — Plan descriptions
  - `updated_by` (uuid, FK → auth.users, nullable) — Last admin who edited
  - `created_at`, `updated_at` timestamps

  ### country_investment_plans
  - Identical structure to country_retirement_plans but for investment plan types

  ## Security
  - RLS enabled on both tables
  - Authenticated users can SELECT (read) both tables (needed to display plans on user pages)
  - Only admins (is_admin = true) can INSERT / UPDATE / DELETE
  - Admin check uses a security-definer RPC to avoid recursion
*/

CREATE TABLE IF NOT EXISTS country_retirement_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  plan_1_name text DEFAULT '',
  plan_1_description text DEFAULT '',
  plan_2_name text DEFAULT '',
  plan_2_description text DEFAULT '',
  plan_3_name text DEFAULT '',
  plan_3_description text DEFAULT '',
  plan_4_name text DEFAULT '',
  plan_4_description text DEFAULT '',
  plan_5_name text DEFAULT '',
  plan_5_description text DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS country_investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  plan_1_name text DEFAULT '',
  plan_1_description text DEFAULT '',
  plan_2_name text DEFAULT '',
  plan_2_description text DEFAULT '',
  plan_3_name text DEFAULT '',
  plan_3_description text DEFAULT '',
  plan_4_name text DEFAULT '',
  plan_4_description text DEFAULT '',
  plan_5_name text DEFAULT '',
  plan_5_description text DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE country_retirement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_investment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read retirement plans"
  ON country_retirement_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert retirement plans"
  ON country_retirement_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update retirement plans"
  ON country_retirement_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete retirement plans"
  ON country_retirement_plans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Authenticated users can read investment plans"
  ON country_investment_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert investment plans"
  ON country_investment_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update investment plans"
  ON country_investment_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete investment plans"
  ON country_investment_plans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
