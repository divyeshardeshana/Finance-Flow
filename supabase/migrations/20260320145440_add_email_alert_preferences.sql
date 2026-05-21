/*
  # Add Email Alert Preferences to user_profiles

  ## Summary
  Extends the user_profiles table with granular email alert preference columns
  so users can control which types of notifications they receive.

  ## New Columns on user_profiles
  - `alert_budget_threshold` (boolean) - Alert when spending exceeds budget %
  - `alert_budget_threshold_pct` (integer) - Threshold % to trigger budget alert (default 80)
  - `alert_large_transaction` (boolean) - Alert on large/unusual transactions
  - `alert_large_transaction_amount` (numeric) - Amount above which to trigger alert (default 500)
  - `alert_bill_reminder` (boolean) - Alert before bill due dates
  - `alert_bill_reminder_days` (integer) - Days before due date to send reminder (default 3)
  - `alert_monthly_summary` (boolean) - Monthly financial summary email
  - `alert_savings_goal_milestone` (boolean) - Alert when savings goal milestone reached
  - `alert_low_balance` (boolean) - Alert when account balance is low
  - `alert_low_balance_amount` (numeric) - Threshold below which to alert (default 100)
  - `alert_weekly_digest` (boolean) - Weekly spending digest
  - `alert_unusual_activity` (boolean) - Alert on unusual spending patterns

  ## Notes
  - All boolean alerts default to true (opt-in by default)
  - Numeric thresholds have sensible defaults
  - No destructive changes; only additive column additions
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_budget_threshold') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_budget_threshold boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_budget_threshold_pct') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_budget_threshold_pct integer DEFAULT 80;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_large_transaction') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_large_transaction boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_large_transaction_amount') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_large_transaction_amount numeric DEFAULT 500;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_bill_reminder') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_bill_reminder boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_bill_reminder_days') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_bill_reminder_days integer DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_monthly_summary') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_monthly_summary boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_savings_goal_milestone') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_savings_goal_milestone boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_low_balance') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_low_balance boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_low_balance_amount') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_low_balance_amount numeric DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_weekly_digest') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_weekly_digest boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'alert_unusual_activity') THEN
    ALTER TABLE user_profiles ADD COLUMN alert_unusual_activity boolean DEFAULT true;
  END IF;
END $$;
