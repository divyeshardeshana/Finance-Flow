-- Restrict non-admin users from reading sensitive system settings (API keys, secrets)
-- Previously all authenticated users could read ALL system_settings rows.

-- Drop any existing read policy on system_settings for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Users can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Allow public read of system settings" ON system_settings;
DROP POLICY IF EXISTS "Authenticated users can read non-sensitive settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can read all system settings" ON system_settings;

-- Non-sensitive settings readable by all authenticated users (branding, currency, etc.)
CREATE POLICY "Authenticated users can read non-sensitive settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    setting_key NOT IN (
      'openai_api_key',
      'stripe_secret_key',
      'stripe_webhook_secret',
      'smtp_password',
      'sendgrid_api_key',
      'resend_api_key',
      'service_role_key'
    )
  );

-- Sensitive settings only readable by admins
CREATE POLICY "Admins can read all system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );
