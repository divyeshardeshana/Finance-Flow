CREATE OR REPLACE FUNCTION get_tickets_for_admin(filter_status text DEFAULT 'all', filter_priority text DEFAULT 'all', assigned_to uuid DEFAULT NULL, offset_count integer DEFAULT 0, limit_count integer DEFAULT 20)
RETURNS TABLE (id uuid, user_id uuid, subject text, description text, category text, priority text, status text, assigned_admin_id uuid, created_at timestamptz, updated_at timestamptz, user_profiles jsonb)
SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  RETURN QUERY
  SELECT st.id, st.user_id, st.subject, st.description, st.category, st.priority, st.status, st.assigned_admin_id, st.created_at, st.updated_at,
    jsonb_build_object('full_name', up.full_name, 'email', au.email) as user_profiles
  FROM support_tickets st
  LEFT JOIN user_profiles up ON st.user_id = up.id
  LEFT JOIN auth.users au ON st.user_id = au.id
  WHERE (filter_status = 'all' OR st.status = filter_status)
    AND (filter_priority = 'all' OR st.priority = filter_priority)
    AND (assigned_to IS NULL OR st.assigned_admin_id = assigned_to)
  ORDER BY st.created_at DESC LIMIT limit_count OFFSET offset_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_tickets_count_for_admin(filter_status text DEFAULT 'all', filter_priority text DEFAULT 'all', assigned_to uuid DEFAULT NULL)
RETURNS bigint SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
DECLARE ticket_count bigint;
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  SELECT COUNT(*) INTO ticket_count FROM support_tickets st
  WHERE (filter_status = 'all' OR st.status = filter_status)
    AND (filter_priority = 'all' OR st.priority = filter_priority)
    AND (assigned_to IS NULL OR st.assigned_admin_id = assigned_to);
  RETURN ticket_count;
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

CREATE OR REPLACE FUNCTION create_user_notification(target_user_id uuid, notification_title text, notification_message text, notification_type text DEFAULT 'system', notification_related_id uuid DEFAULT NULL)
RETURNS uuid SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$
DECLARE notification_id uuid;
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  INSERT INTO user_notifications (user_id, title, message, type, related_id, is_read, created_at)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_related_id, false, now())
  RETURNING id INTO notification_id;
  RETURN notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tickets_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_tickets_count_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_ticket_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_count_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_user_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_ticket_status TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_assign_tickets TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_notification TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;
