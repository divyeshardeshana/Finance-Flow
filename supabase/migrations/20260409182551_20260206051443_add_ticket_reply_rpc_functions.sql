/*
  # Add SECURITY DEFINER functions for ticket replies

  1. New Functions
    - `admin_reply_to_ticket` - Allows admins to reply to any ticket, bypassing RLS
    - `user_reply_to_ticket` - Allows users to reply to their own tickets, bypassing RLS
    - `get_user_ticket_messages` - Allows users to fetch messages for their own tickets

  2. Security
    - Both functions verify caller identity before executing
    - admin function checks is_admin_user()
    - user function checks ticket ownership
*/

CREATE OR REPLACE FUNCTION public.admin_reply_to_ticket(
  p_ticket_id uuid,
  p_admin_user_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_message_id uuid;
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  INSERT INTO ticket_messages (ticket_id, user_id, message, is_staff_reply)
  VALUES (p_ticket_id, p_admin_user_id, p_message, true)
  RETURNING id INTO new_message_id;

  UPDATE support_tickets
  SET status = 'waiting_response', updated_at = now()
  WHERE id = p_ticket_id AND status IN ('open', 'in_progress');

  RETURN new_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_reply_to_ticket(
  p_ticket_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_message_id uuid;
  ticket_owner uuid;
BEGIN
  SELECT user_id INTO ticket_owner
  FROM support_tickets
  WHERE id = p_ticket_id;

  IF ticket_owner IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF ticket_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only reply to your own tickets';
  END IF;

  INSERT INTO ticket_messages (ticket_id, user_id, message, is_staff_reply)
  VALUES (p_ticket_id, auth.uid(), p_message, false)
  RETURNING id INTO new_message_id;

  UPDATE support_tickets
  SET status = 'open', updated_at = now()
  WHERE id = p_ticket_id AND status = 'waiting_response';

  RETURN new_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_ticket_messages(p_ticket_id uuid)
RETURNS TABLE(
  id uuid,
  ticket_id uuid,
  user_id uuid,
  message text,
  is_staff_reply boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ticket_owner uuid;
BEGIN
  SELECT st.user_id INTO ticket_owner
  FROM support_tickets st
  WHERE st.id = p_ticket_id;

  IF ticket_owner IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF ticket_owner != auth.uid() AND NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    tm.id,
    tm.ticket_id,
    tm.user_id,
    tm.message,
    tm.is_staff_reply,
    tm.created_at
  FROM ticket_messages tm
  WHERE tm.ticket_id = p_ticket_id
  ORDER BY tm.created_at ASC;
END;
$$;
