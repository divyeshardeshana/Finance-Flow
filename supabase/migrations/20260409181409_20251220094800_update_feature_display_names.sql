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

UPDATE subscription_tiers SET features = '["Transaction Tracking","Budget Planning","Financial Reports","Investment Tracking","AI Financial Assistant","Financial Learning"]'::jsonb WHERE tier_name = 'free';
UPDATE subscription_tiers SET features = '["Transaction Tracking","Budget Planning","Financial Reports","Investment Tracking","AI Financial Assistant","Financial Learning","Bill Reminders","Split Expenses","Priority Support","Advanced Goal Planning","Advanced Reports & Export"]'::jsonb WHERE tier_name = 'paid';
UPDATE subscription_tiers SET features = '["Transaction Tracking","Budget Planning","Financial Reports","Investment Tracking","AI Financial Assistant","Financial Learning","Bill Reminders","Split Expenses","Priority Support","Advanced Goal Planning","Advanced Reports & Export","Net Worth Tracking","Portfolio Analytics","Retirement Planning","Estate Planning"]'::jsonb WHERE tier_name = 'premium';
