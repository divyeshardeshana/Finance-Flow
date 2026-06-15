-- Deactivate duplicate net_worth_tracking (app uses net_worth_tracker consistently).
-- Both had same display name "Net Worth Tracking" causing two rows in Feature Management.
UPDATE app_features SET is_active = false WHERE feature_name = 'net_worth_tracking';

-- Ensure net_worth_tracker is active and has correct display name.
UPDATE app_features
SET display_name = 'Net Worth Tracking',
    description  = 'Track assets and liabilities with live updates',
    is_active    = true
WHERE feature_name = 'net_worth_tracker';
