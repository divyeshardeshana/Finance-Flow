-- Insert a non-sensitive flag that regular users can read to know Stripe is configured.
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
VALUES ('stripe_configured', 'true', 'feature_flag', 'Whether Stripe payments have been configured by an admin', false)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'true', updated_at = now();

-- Extend the existing user-readable RLS policy to also cover this new flag.
DROP POLICY IF EXISTS "Authenticated users can read stripe environment" ON system_settings;

CREATE POLICY "Authenticated users can read stripe environment"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    setting_key IN ('stripe_environment', 'stripe_configured')
    AND is_sensitive = false
  );
