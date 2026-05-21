CREATE OR REPLACE FUNCTION get_users_for_admin(
  search_term text DEFAULT '',
  filter_tier text DEFAULT 'all',
  offset_count integer DEFAULT 0,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid, full_name text, email text, subscription_tier text,
  is_admin boolean, admin_role text, created_at timestamptz,
  photo_url text, country text, currency text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  RETURN QUERY
  SELECT up.id, up.full_name, au.email, up.subscription_tier, up.is_admin, up.admin_role, up.created_at, up.photo_url, up.country, up.currency
  FROM user_profiles up
  INNER JOIN auth.users au ON up.id = au.id
  WHERE (filter_tier = 'all' OR up.subscription_tier = filter_tier)
    AND (search_term = '' OR up.full_name ILIKE '%' || search_term || '%' OR au.email ILIKE '%' || search_term || '%' OR up.id::text ILIKE '%' || search_term || '%')
  ORDER BY up.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_for_admin TO authenticated;

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
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  SELECT COUNT(*) INTO user_count
  FROM user_profiles up
  INNER JOIN auth.users au ON up.id = au.id
  WHERE (filter_tier = 'all' OR up.subscription_tier = filter_tier)
    AND (search_term = '' OR up.full_name ILIKE '%' || search_term || '%' OR au.email ILIKE '%' || search_term || '%' OR up.id::text ILIKE '%' || search_term || '%');
  RETURN user_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_count_for_admin TO authenticated;
