/*
  # Add System Backups Table and Google Analytics Settings

  1. New Tables
    - `system_backups` for tracking admin-created database backups

  2. New Settings
    - `google_analytics_enabled` (feature_flag)
    - `google_analytics_id` (config)

  3. Security
    - Enable RLS on `system_backups` table
    - Only authenticated admins can access system backups
*/

CREATE TABLE IF NOT EXISTS system_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name text NOT NULL,
  backup_type text NOT NULL DEFAULT 'full',
  status text NOT NULL DEFAULT 'pending',
  file_size_bytes bigint DEFAULT 0,
  backup_data jsonb,
  record_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT system_backups_type_check CHECK (backup_type IN ('full', 'users', 'transactions', 'financial')),
  CONSTRAINT system_backups_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'))
);

ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system backups"
  ON system_backups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can create system backups"
  ON system_backups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update system backups"
  ON system_backups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete system backups"
  ON system_backups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_sensitive)
VALUES
  ('google_analytics_enabled', 'false', 'feature_flag', 'Enable or disable Google Analytics tracking across the application', false),
  ('google_analytics_id', '', 'config', 'Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)', false)
ON CONFLICT (setting_key) DO NOTHING;
