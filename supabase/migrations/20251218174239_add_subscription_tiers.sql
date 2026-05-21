/*
  # Add Subscription Management System

  ## Overview
  Creates the complete subscription tier system to manage Free, Paid, and Premium plans.
  Enables feature-gating and usage tracking across the application.

  ## New Tables Created

  ### 1. `subscription_tiers`
  Define available subscription tiers and their pricing:
  - `id` (uuid, primary key)
  - `tier_name` (text) - 'free', 'paid', 'premium'
  - `display_name` (text) - User-friendly name
  - `monthly_price` (numeric) - Monthly subscription cost
  - `annual_price` (numeric) - Annual subscription cost
  - `features` (jsonb) - List of included features
  - `max_goals` (integer) - Maximum number of goals allowed
  - `is_active` (boolean) - Whether tier is currently available
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `user_subscriptions`
  Track user subscription status and history:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `tier_id` (uuid, FK to subscription_tiers)
  - `status` (text) - 'active', 'cancelled', 'expired', 'trial'
  - `start_date` (timestamptz)
  - `end_date` (timestamptz)
  - `auto_renew` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `feature_access_log`
  Audit log for feature access attempts:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `feature_name` (text)
  - `accessed_at` (timestamptz)
  - `allowed` (boolean)
  - `tier_required` (text)

  ## Table Updates

  ### Update `user_profiles`
  Add subscription-related fields:
  - `subscription_tier` (text) - Current tier: 'free', 'paid', 'premium'
  - `trial_ends_at` (timestamptz) - Trial expiration date

  ## Security
  - Enable RLS on all new tables
  - Users can view their own subscription data
  - Feature access logs are private to each user
  - Only admins can modify subscription_tiers table

  ## Indexes
  - Add indexes on user_id for efficient queries
  - Add index on tier_name for lookups
*/

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name text UNIQUE NOT NULL CHECK (tier_name IN ('free', 'paid', 'premium')),
  display_name text NOT NULL,
  monthly_price numeric DEFAULT 0,
  annual_price numeric DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  max_goals integer DEFAULT 3,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription tiers"
  ON subscription_tiers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES subscription_tiers(id) ON DELETE RESTRICT,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tier_id, start_date)
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create feature_access_log table
CREATE TABLE IF NOT EXISTS feature_access_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  accessed_at timestamptz DEFAULT now(),
  allowed boolean DEFAULT false,
  tier_required text
);

ALTER TABLE feature_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access logs"
  ON feature_access_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own access logs"
  ON feature_access_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add subscription fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'paid', 'premium'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN trial_ends_at timestamptz;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_tier_name ON subscription_tiers(tier_name);
CREATE INDEX IF NOT EXISTS idx_feature_access_log_user_id ON feature_access_log(user_id);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (tier_name, display_name, monthly_price, annual_price, features, max_goals) VALUES
  ('free', 'Free Plan', 0, 0, 
   '["basic_transactions", "basic_budget", "basic_reports", "basic_investment", "financial_assistant", "literacy_gamification"]'::jsonb,
   3),
  ('paid', 'Paid Plan', 9.99, 99.99,
   '["basic_transactions", "basic_budget", "basic_reports", "basic_investment", "financial_assistant", "literacy_gamification", "bill_reminders", "split_transactions", "support_tickets", "advanced_goals", "advanced_reports"]'::jsonb,
   10),
  ('premium', 'Premium Plan', 19.99, 199.99,
   '["basic_transactions", "basic_budget", "basic_reports", "basic_investment", "financial_assistant", "literacy_gamification", "bill_reminders", "split_transactions", "support_tickets", "advanced_goals", "advanced_reports", "net_worth_tracker", "advanced_investments", "retirement_planning", "estate_planning"]'::jsonb,
   10)
ON CONFLICT (tier_name) DO NOTHING;

-- Initialize existing users with free tier subscription
DO $$
DECLARE
  free_tier_id uuid;
  user_record RECORD;
BEGIN
  -- Get the free tier ID
  SELECT id INTO free_tier_id FROM subscription_tiers WHERE tier_name = 'free';
  
  -- Create subscription for all existing users who don't have one
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM user_subscriptions)
  LOOP
    INSERT INTO user_subscriptions (user_id, tier_id, status, start_date)
    VALUES (user_record.id, free_tier_id, 'active', now());
  END LOOP;
END $$;