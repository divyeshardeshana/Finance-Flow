/*
  # Add Admin Helper Functions
  
  1. New Functions
    - `get_ticket_messages` - Retrieves all messages for a specific ticket with user details
    - `bulk_update_user_subscriptions` - Updates subscription tier for multiple users at once
    - `bulk_update_ticket_status` - Updates status for multiple tickets at once
    
  2. Security
    - All functions check for admin privileges before executing
    - Functions use SECURITY DEFINER to bypass RLS where needed
*/

-- Function to get all messages for a ticket (for conversation history)
CREATE OR REPLACE FUNCTION get_ticket_messages(ticket_id_param uuid)
RETURNS TABLE (
  id uuid,
  ticket_id uuid,
  user_id uuid,
  message text,
  is_staff_reply boolean,
  created_at timestamptz,
  user_name text,
  user_email text
)
SECURITY DEFINER
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

  -- Return ticket messages with user info
  RETURN QUERY
  SELECT 
    tm.id,
    tm.ticket_id,
    tm.user_id,
    tm.message,
    tm.is_staff_reply,
    tm.created_at,
    up.full_name as user_name,
    au.email as user_email
  FROM ticket_messages tm
  LEFT JOIN user_profiles up ON tm.user_id = up.id
  LEFT JOIN auth.users au ON tm.user_id = au.id
  WHERE tm.ticket_id = ticket_id_param
  ORDER BY tm.created_at ASC;
END;
$$;

-- Function to bulk update user subscriptions
CREATE OR REPLACE FUNCTION bulk_update_user_subscriptions(
  user_ids uuid[],
  new_tier text
)
RETURNS integer
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update user subscription tiers
  UPDATE user_profiles
  SET 
    subscription_tier = new_tier,
    updated_at = now()
  WHERE id = ANY(user_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Function to bulk update ticket statuses
CREATE OR REPLACE FUNCTION bulk_update_ticket_status(
  ticket_ids uuid[],
  new_status text
)
RETURNS integer
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update ticket statuses
  UPDATE support_tickets
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = ANY(ticket_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Function to bulk assign tickets
CREATE OR REPLACE FUNCTION bulk_assign_tickets(
  ticket_ids uuid[],
  admin_id uuid
)
RETURNS integer
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Assign tickets to admin
  UPDATE support_tickets
  SET 
    assigned_admin_id = admin_id,
    status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
    updated_at = now()
  WHERE id = ANY(ticket_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;