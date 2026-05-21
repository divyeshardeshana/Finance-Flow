/*
  # Add email_alerts to app_features and feature_tier_config

  ## Changes
  1. Insert email_alerts into app_features if missing
  2. Enable email_alerts for paid and premium tiers in feature_tier_config
*/

INSERT INTO app_features (feature_name, display_name, description, category, is_active, sort_order)
VALUES (
  'email_alerts',
  'Email Alerts',
  'Receive email notifications for budget thresholds, large transactions, bill reminders, and more',
  'Notifications',
  true,
  90
)
ON CONFLICT (feature_name) DO NOTHING;

-- Enable for paid tier
INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled)
SELECT 'email_alerts', id, true
FROM subscription_tiers WHERE tier_name = 'paid'
ON CONFLICT (feature_name, tier_id) DO UPDATE SET is_enabled = true;

-- Enable for premium tier
INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled)
SELECT 'email_alerts', id, true
FROM subscription_tiers WHERE tier_name = 'premium'
ON CONFLICT (feature_name, tier_id) DO UPDATE SET is_enabled = true;
