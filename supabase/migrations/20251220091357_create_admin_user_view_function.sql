/*
  # Create Admin Function to Fetch Users with Emails

  ## Overview
  Creates a secure database function that allows admin users to retrieve
  user information including email addresses from the auth.users table.

  ## New Functions

  ### `get_users_for_admin`
  Retrieves user profile data along with email addresses from auth.users.
  - Uses SECURITY DEFINER to bypass RLS restrictions
  - Only callable by users with admin role
  - Returns combined data from user_profiles and auth.users

  ## Security
  - Function checks that caller has is_admin = true
  - Uses SECURITY DEFINER to access auth.users table
  - Returns email addresses only to authorized admins
*/

-- Create function to get users with email for admin panel
CREATE OR REPLACE FUNCTION get_users_for_admin(
  search_term text DEFAULT '',
  filter_tier text DEFAULT 'all',
  offset_count integer DEFAULT 0,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  subscription_tier text,
  is_admin boolean,
  admin_role text,
  created_at timestamptz,
  photo_url text,
  country text,
  currency text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return user data with emails
  RETURN QUERY
  SELECT
    up.id,
    up.full_name,
    au.email,
    up.subscription_tier,
    up.is_admin,
    up.admin_role,
    up.created_at,
    up.photo_url,
    up.country,
    up.currency
  FROM user_profiles up
  INNER JOIN auth.users au ON up.id = au.id
  WHERE
    (filter_tier = 'all' OR up.subscription_tier = filter_tier)
    AND (
      search_term = ''
      OR up.full_name ILIKE '%' || search_term || '%'
      OR au.email ILIKE '%' || search_term || '%'
      OR up.id::text ILIKE '%' || search_term || '%'
    )
  ORDER BY up.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_for_admin TO authenticated;

-- Create function to get user count for admin panel
CREATE OR REPLACE FUNCTION get_users_count_for_admin(
  search_term text DEFAULT '',
  filter_tier text DEFAULT 'all'
)
RETURNS bigint
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_count bigint;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get count
  SELECT COUNT(*)
  INTO user_count
  FROM user_profiles up
  INNER JOIN auth.users au ON up.id = au.id
  WHERE
    (filter_tier = 'all' OR up.subscription_tier = filter_tier)
    AND (
      search_term = ''
      OR up.full_name ILIKE '%' || search_term || '%'
      OR au.email ILIKE '%' || search_term || '%'
      OR up.id::text ILIKE '%' || search_term || '%'
    );

  RETURN user_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_count_for_admin TO authenticated;
