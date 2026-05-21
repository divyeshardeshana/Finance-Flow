/*
  # Add System Configuration Settings

  1. New Settings Added
    - **Stripe Test Environment**
      - stripe_test_secret_key: Test secret key for Stripe API
      - stripe_test_publishable_key: Test publishable key for Stripe
      - stripe_test_webhook_secret: Test webhook signing secret
      - stripe_production_secret_key: Production secret key for Stripe API
      - stripe_production_publishable_key: Production publishable key for Stripe
      - stripe_production_webhook_secret: Production webhook signing secret
      - stripe_active_environment: Current active environment (test/production)

    - **SMTP Configuration**
      - smtp_provider: Email service provider (zoho, gmail, office365, sendgrid, mailgun, custom)
      - smtp_host: SMTP server hostname
      - smtp_port: SMTP server port
      - smtp_username: SMTP authentication username
      - smtp_password: SMTP authentication password (encrypted)
      - smtp_from_email: From email address
      - smtp_from_name: From name for emails
      - smtp_use_tls: Enable TLS/STARTTLS

    - **Email Content Configuration**
      - email_subject_template: Template for email subject lines
      - email_footer_text: Footer text for emails
      - email_help_text: Help text for email footer
      - welcome_email_template: Welcome email content
      - password_reset_template: Password reset email content
      - notification_email_template: General notification email content

    - **Security Settings**
      - enable_2fa: Enable two-factor authentication
      - session_timeout_hours: Session timeout in hours
      - jwt_expiration_days: JWT token expiration in days
      - jwt_secret_key: JWT signing secret key
      - min_password_length: Minimum password length
      - require_special_chars: Require special characters in password
      - require_numbers: Require numbers in password
      - require_uppercase: Require uppercase letters in password
      - prevent_password_reuse: Prevent password reuse
      - password_history_count: Number of previous passwords to remember
      - enable_account_lockout: Enable account lockout on failed attempts
      - max_login_attempts: Maximum login attempts before lockout
      - lockout_duration_minutes: Account lockout duration in minutes
      - enable_ip_whitelist: Enable IP whitelist for admin access
      - allowed_ip_addresses: Comma-separated list of allowed IP addresses

  2. Security
    - All settings are protected by existing RLS policies on system_settings table
    - Sensitive settings are marked with is_sensitive = true
*/

-- Insert Stripe Test Environment Settings
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

-- Insert SMTP Configuration Settings
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

-- Insert Email Content Configuration Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
VALUES
  ('email_subject_template', 'Your [EVENT_TYPE] - [EVENT_DATE]', 'config', 'Email subject line template with placeholders', false),
  ('email_footer_text', 'Created with ❤️ by YourApp', 'config', 'Footer text for emails', false),
  ('email_help_text', 'Need help? Reply to this email.', 'config', 'Help text for email footer', false),
  ('welcome_email_template', 'Welcome! Your account has been created successfully.', 'config', 'Welcome email content', false),
  ('password_reset_template', 'Click the link below to reset your password.', 'config', 'Password reset email content', false),
  ('notification_email_template', 'You have a new notification.', 'config', 'General notification email content', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert Security Settings
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
