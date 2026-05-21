/*
  # Add System Configuration Settings

  Adds Stripe, SMTP, email content, and security settings to system_settings table.
*/

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
VALUES
  ('stripe_test_secret_key', '', 'api_key', 'Stripe test environment secret key', true),
  ('stripe_test_publishable_key', '', 'api_key', 'Stripe test environment publishable key', false),
  ('stripe_test_webhook_secret', '', 'api_key', 'Stripe test environment webhook secret', true),
  ('stripe_production_secret_key', '', 'api_key', 'Stripe production environment secret key', true),
  ('stripe_production_publishable_key', '', 'api_key', 'Stripe production environment publishable key', false),
  ('stripe_production_webhook_secret', '', 'api_key', 'Stripe production environment webhook secret', true),
  ('stripe_active_environment', 'test', 'config', 'Active Stripe environment (test or production)', false)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
VALUES
  ('smtp_provider', 'custom', 'config', 'Email service provider', false),
  ('smtp_host', '', 'config', 'SMTP server hostname', false),
  ('smtp_port', '587', 'config', 'SMTP server port', false),
  ('smtp_username', '', 'config', 'SMTP authentication username', false),
  ('smtp_password', '', 'api_key', 'SMTP authentication password', true),
  ('smtp_from_email', '', 'config', 'From email address', false),
  ('smtp_from_name', '', 'config', 'From name for emails', false),
  ('smtp_use_tls', 'true', 'config', 'Enable TLS/STARTTLS', false)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
VALUES
  ('email_subject_template', 'Your [EVENT_TYPE] - [EVENT_DATE]', 'config', 'Email subject line template with placeholders', false),
  ('email_footer_text', 'Created with love by YourApp', 'config', 'Footer text for emails', false),
  ('email_help_text', 'Need help? Reply to this email.', 'config', 'Help text for email footer', false),
  ('welcome_email_template', 'Welcome! Your account has been created successfully.', 'config', 'Welcome email content', false),
  ('password_reset_template', 'Click the link below to reset your password.', 'config', 'Password reset email content', false),
  ('notification_email_template', 'You have a new notification.', 'config', 'General notification email content', false)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
VALUES
  ('enable_2fa', 'false', 'feature_flag', 'Enable two-factor authentication', false),
  ('session_timeout_hours', '24', 'config', 'Session timeout in hours', false),
  ('jwt_expiration_days', '7', 'config', 'JWT token expiration in days', false),
  ('jwt_secret_key', '', 'api_key', 'JWT signing secret key', true),
  ('min_password_length', '8', 'config', 'Minimum password length', false),
  ('require_special_chars', 'true', 'feature_flag', 'Require special characters in password', false),
  ('require_numbers', 'true', 'feature_flag', 'Require numbers in password', false),
  ('require_uppercase', 'true', 'feature_flag', 'Require uppercase letters in password', false),
  ('prevent_password_reuse', 'true', 'feature_flag', 'Prevent password reuse', false),
  ('password_history_count', '5', 'config', 'Number of previous passwords to remember', false),
  ('enable_account_lockout', 'true', 'feature_flag', 'Enable account lockout on failed attempts', false),
  ('max_login_attempts', '5', 'config', 'Maximum login attempts before lockout', false),
  ('lockout_duration_minutes', '30', 'config', 'Account lockout duration in minutes', false),
  ('enable_ip_whitelist', 'false', 'feature_flag', 'Enable IP whitelist for admin access', false),
  ('allowed_ip_addresses', '', 'config', 'Comma-separated list of allowed IP addresses', false)
ON CONFLICT (setting_key) DO NOTHING;
