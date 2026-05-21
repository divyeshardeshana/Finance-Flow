/*
  # Fix Admin User Loading - Apply RPC Function Updates

  ## Overview
  Updates the get_users_for_admin and get_users_count_for_admin functions
  to use the is_admin_user() helper function instead of direct queries.
  This prevents RLS recursion issues that cause "Error loading users".

  ## Changes
  1. Update get_users_for_admin to use is_admin_user()
  2. Update get_users_count_for_admin to use is_admin_user()

  ## Security
  - Maintains admin-only access
  - Uses SECURITY DEFINER safely through is_admin_user()
  - No RLS policy conflicts
*/

-- Fix get_users_for_admin function
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
  -- Check if the caller is an admin using the helper function
  IF NOT is_admin_user(auth.uid()) THEN
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

-- Fix get_users_count_for_admin function
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
  -- Check if the caller is an admin using the helper function
  IF NOT is_admin_user(auth.uid()) THEN
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_count_for_admin TO authenticated;
