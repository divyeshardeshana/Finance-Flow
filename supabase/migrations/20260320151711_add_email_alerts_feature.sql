/*
  # Add Email Alerts Feature to Feature Management System

  ## Summary
  Adds "Email Alerts" as a managed feature in the feature management system so
  admins can control which subscription plans have access to email alert configuration.

  ## Changes

  ### Modified Tables
  - `app_features` — inserts a new row for `email_alerts`
  - `feature_tier_config` — seeds default tier access rules for the new feature

  ## New Feature
  - **feature_name**: `email_alerts`
  - **display_name**: Email Alerts
  - **description**: Configure email notifications for budget thresholds, large transactions, bill reminders, and more
  - **category**: Notifications
  - **sort_order**: 10

  ## Default Tier Access
  - Free: disabled (users must upgrade to configure alert preferences)
  - Paid: enabled
  - Premium: enabled

  ## Security
  - No RLS changes required; existing policies on `app_features` and `feature_tier_config` already cover this data
*/

INSERT INTO app_features (feature_name, display_name, description, category, is_active, sort_order)
VALUES (
  'email_alerts',
  'Email Alerts',
  'Configure email notifications for budget thresholds, large transactions, bill reminders, and more',
  'Notifications',
  true,
  10
)
ON CONFLICT (feature_name) DO UPDATE
  SET display_name  = EXCLUDED.display_name,
      description   = EXCLUDED.description,
      category      = EXCLUDED.category,
      is_active     = EXCLUDED.is_active,
      sort_order    = EXCLUDED.sort_order,
      updated_at    = now();

INSERT INTO feature_tier_config (feature_name, tier_id, is_enabled)
SELECT 'email_alerts', id, CASE WHEN tier_name = 'free' THEN false ELSE true END
FROM subscription_tiers
WHERE is_active = true
ON CONFLICT (feature_name, tier_id) DO NOTHING;
