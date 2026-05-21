CREATE OR REPLACE FUNCTION get_users_for_admin(search_term text DEFAULT '', filter_tier text DEFAULT 'all', offset_count integer DEFAULT 0, limit_count integer DEFAULT 20)
RETURNS TABLE (id uuid, full_name text, email text, subscription_tier text, is_admin boolean, admin_role text, created_at timestamptz, photo_url text, country text, currency text)
SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  RETURN QUERY
  SELECT up.id, up.full_name, au.email, up.subscription_tier, up.is_admin, up.admin_role, up.created_at, up.photo_url, up.country, up.currency
  FROM user_profiles up INNER JOIN auth.users au ON up.id = au.id
  WHERE (filter_tier = 'all' OR up.subscription_tier = filter_tier)
    AND (search_term = '' OR up.full_name ILIKE '%' || search_term || '%' OR au.email ILIKE '%' || search_term || '%' OR up.id::text ILIKE '%' || search_term || '%')
  ORDER BY up.created_at DESC LIMIT limit_count OFFSET offset_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_users_count_for_admin(search_term text DEFAULT '', filter_tier text DEFAULT 'all')
RETURNS bigint SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
DECLARE user_count bigint;
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  SELECT COUNT(*) INTO user_count FROM user_profiles up INNER JOIN auth.users au ON up.id = au.id
  WHERE (filter_tier = 'all' OR up.subscription_tier = filter_tier)
    AND (search_term = '' OR up.full_name ILIKE '%' || search_term || '%' OR au.email ILIKE '%' || search_term || '%' OR up.id::text ILIKE '%' || search_term || '%');
  RETURN user_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_ticket_messages(ticket_id_param uuid)
RETURNS TABLE (id uuid, ticket_id uuid, user_id uuid, message text, is_staff_reply boolean, created_at timestamptz, user_name text, user_email text)
SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  RETURN QUERY
  SELECT tm.id, tm.ticket_id, tm.user_id, tm.message, tm.is_staff_reply, tm.created_at, up.full_name as user_name, au.email as user_email
  FROM ticket_messages tm LEFT JOIN user_profiles up ON tm.user_id = up.id LEFT JOIN auth.users au ON tm.user_id = au.id
  WHERE tm.ticket_id = ticket_id_param ORDER BY tm.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION bulk_update_user_subscriptions(user_ids uuid[], new_tier text)
RETURNS integer SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
DECLARE updated_count integer;
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  UPDATE user_profiles SET subscription_tier = new_tier, updated_at = now() WHERE id = ANY(user_ids);
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION bulk_update_ticket_status(ticket_ids uuid[], new_status text)
RETURNS integer SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
DECLARE updated_count integer;
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  UPDATE support_tickets SET status = new_status, updated_at = now() WHERE id = ANY(ticket_ids);
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION bulk_assign_tickets(ticket_ids uuid[], admin_id uuid)
RETURNS integer SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
DECLARE updated_count integer;
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  UPDATE support_tickets SET assigned_admin_id = admin_id, status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END, updated_at = now() WHERE id = ANY(ticket_ids);
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
