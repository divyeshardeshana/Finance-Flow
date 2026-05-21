/*
  # Add User Active Status and Login Tracking

  1. Modified Tables
    - `user_profiles`
      - `is_active` (boolean, default true) - allows admins to deactivate users
      - `last_login_at` (timestamptz, nullable) - tracks last login time

  2. New Tables
    - `login_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `login_at` (timestamptz, default now())
      - `ip_address` (text, nullable)
      - `user_agent` (text, nullable)
      - `login_method` (text, default 'password')
      - `success` (boolean, default true)

  3. Security
    - Enable RLS on `login_history`
    - Users can read their own login history
    - Admins can read all login history

  4. Functions
    - `log_user_login` - SECURITY DEFINER function to log login events
    - `admin_toggle_user_active` - SECURITY DEFINER function for admin to activate/deactivate users
    - `admin_get_login_history` - SECURITY DEFINER function for admin to view user login history
*/

-- Add is_active and last_login_at to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_login_at timestamptz;
  END IF;
END $$;

-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  login_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  login_method text DEFAULT 'password',
  success boolean DEFAULT true
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own login history
CREATE POLICY "Users can view own login history"
  ON login_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to log user login
CREATE OR REPLACE FUNCTION log_user_login(p_ip_address text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO login_history (user_id, ip_address, user_agent, login_method, success)
  VALUES (auth.uid(), p_ip_address, p_user_agent, 'password', true);

  UPDATE user_profiles
  SET last_login_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Function for admin to toggle user active status
CREATE OR REPLACE FUNCTION admin_toggle_user_active(p_user_id uuid, p_is_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  UPDATE user_profiles
  SET is_active = p_is_active, updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Function for admin to get login history for a user
CREATE OR REPLACE FUNCTION admin_get_login_history(p_user_id uuid, p_limit integer DEFAULT 20)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  login_at timestamptz,
  ip_address text,
  user_agent text,
  login_method text,
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    lh.id,
    lh.user_id,
    lh.login_at,
    lh.ip_address,
    lh.user_agent,
    lh.login_method,
    lh.success
  FROM login_history lh
  WHERE lh.user_id = p_user_id
  ORDER BY lh.login_at DESC
  LIMIT p_limit;
END;
$$;
