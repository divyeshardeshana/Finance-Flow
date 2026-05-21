/*
  # Update Google Analytics Settings Fields

  1. Changes
    - Add `google_analytics_tracking_id` setting for GA4 Tracking ID
    - Add `google_analytics_measurement_id` setting for GA4 Measurement ID
    - Remove old `google_analytics_id` setting (replaced by two new fields above)
*/

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive, updated_by)
SELECT
  'google_analytics_tracking_id',
  '',
  'config',
  'Google Analytics Tracking ID for GA4 property (e.g., G-XXXXXXXXXX)',
  false,
  (SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings WHERE setting_key = 'google_analytics_tracking_id'
);

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive, updated_by)
SELECT
  'google_analytics_measurement_id',
  '',
  'config',
  'Google Analytics Measurement ID for data stream (e.g., G-XXXXXXXXXX)',
  false,
  (SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings WHERE setting_key = 'google_analytics_measurement_id'
);

DELETE FROM system_settings WHERE setting_key = 'google_analytics_id';
