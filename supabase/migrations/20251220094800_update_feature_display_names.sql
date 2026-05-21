/*
  # Update Feature Names to User-Friendly Display Names

  ## Overview
  Replaces technical feature names with user-friendly display names across
  subscription tiers and feature management system.

  ## Changes
  1. Updates subscription_tiers.features to use readable names
  2. Updates app_features.display_name for better user experience
  3. Maintains feature_name for internal reference

  ## Feature Name Mapping
  - basic_transactions → Transaction Tracking
  - basic_budget → Budget Planning
  - basic_reports → Financial Reports
  - basic_investment → Investment Tracking
  - financial_assistant → AI Financial Assistant
  - literacy_gamification → Financial Learning
  - bill_reminders → Bill Reminders
  - split_transactions → Split Expenses
  - support_tickets → Priority Support
  - advanced_goals → Advanced Goal Planning
  - advanced_reports → Advanced Reports & Export
  - net_worth_tracker → Net Worth Tracking
  - advanced_investments → Portfolio Analytics
  - retirement_planning → Retirement Planning
  - estate_planning → Estate Planning
*/

-- Update app_features display names to be more user-friendly
UPDATE app_features SET display_name = 'Transaction Tracking' WHERE feature_name = 'basic_transactions';
UPDATE app_features SET display_name = 'Budget Planning' WHERE feature_name = 'basic_budget';
UPDATE app_features SET display_name = 'Financial Reports' WHERE feature_name = 'basic_reports';
UPDATE app_features SET display_name = 'Investment Tracking' WHERE feature_name = 'basic_investment';
UPDATE app_features SET display_name = 'AI Financial Assistant' WHERE feature_name = 'financial_assistant';
UPDATE app_features SET display_name = 'Financial Learning' WHERE feature_name = 'literacy_gamification';
UPDATE app_features SET display_name = 'Bill Reminders' WHERE feature_name = 'bill_reminders';
UPDATE app_features SET display_name = 'Split Expenses' WHERE feature_name = 'split_transactions';
UPDATE app_features SET display_name = 'Priority Support' WHERE feature_name = 'support_tickets';
UPDATE app_features SET display_name = 'Advanced Goal Planning' WHERE feature_name = 'advanced_goals';
UPDATE app_features SET display_name = 'Advanced Reports & Export' WHERE feature_name = 'advanced_reports';
UPDATE app_features SET display_name = 'Net Worth Tracking' WHERE feature_name = 'net_worth_tracker';
UPDATE app_features SET display_name = 'Portfolio Analytics' WHERE feature_name = 'advanced_investments';
UPDATE app_features SET display_name = 'Retirement Planning' WHERE feature_name = 'retirement_planning';
UPDATE app_features SET display_name = 'Estate Planning' WHERE feature_name = 'estate_planning';

-- Update subscription_tiers features array with user-friendly names
UPDATE subscription_tiers
SET features = '[
  "Transaction Tracking",
  "Budget Planning",
  "Financial Reports",
  "Investment Tracking",
  "AI Financial Assistant",
  "Financial Learning"
]'::jsonb
WHERE tier_name = 'free';

UPDATE subscription_tiers
SET features = '[
  "Transaction Tracking",
  "Budget Planning",
  "Financial Reports",
  "Investment Tracking",
  "AI Financial Assistant",
  "Financial Learning",
  "Bill Reminders",
  "Split Expenses",
  "Priority Support",
  "Advanced Goal Planning",
  "Advanced Reports & Export"
]'::jsonb
WHERE tier_name = 'paid';

UPDATE subscription_tiers
SET features = '[
  "Transaction Tracking",
  "Budget Planning",
  "Financial Reports",
  "Investment Tracking",
  "AI Financial Assistant",
  "Financial Learning",
  "Bill Reminders",
  "Split Expenses",
  "Priority Support",
  "Advanced Goal Planning",
  "Advanced Reports & Export",
  "Net Worth Tracking",
  "Portfolio Analytics",
  "Retirement Planning",
  "Estate Planning"
]'::jsonb
WHERE tier_name = 'premium';
