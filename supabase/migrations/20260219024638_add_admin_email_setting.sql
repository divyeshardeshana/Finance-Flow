/*
  # Add Admin Email Setting

  1. Changes
    - Adds `admin_email` to the `system_settings` table so the admin can configure
      the email address that receives contact form submissions as BCC.
    - Uses 'config' as the setting_type to match the allowed check constraint values.

  2. Purpose
    - Used by the `send-contact-email` edge function to BCC the admin on
      every contact form submission received through the public Contact Us page.
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
