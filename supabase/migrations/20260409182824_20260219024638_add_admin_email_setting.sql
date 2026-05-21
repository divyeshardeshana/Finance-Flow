/*
  # Add Admin Email Setting

  Adds `admin_email` to system_settings for BCC on contact form submissions.
*/

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
SELECT
  'admin_email',
  '',
  'config',
  'Admin email address that receives BCC copies of Contact Us form submissions.',
  false
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings WHERE setting_key = 'admin_email'
);
