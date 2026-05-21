/*
  # Add User Notifications System

  ## Overview
  Creates a notification system to alert users when admins update their tickets,
  change their subscriptions, or perform other actions affecting their account.

  ## New Tables

  ### `user_notifications`
  Stores notifications for users:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users) - User receiving the notification
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `type` (text) - Type: ticket_update, subscription_change, payment, system, etc.
  - `related_id` (uuid) - ID of related resource (ticket, payment, etc.)
  - `is_read` (boolean) - Whether user has read the notification
  - `created_at` (timestamptz)
  - `read_at` (timestamptz)

  ## Functions

  ### `create_user_notification`
  Helper function to create a notification for a user

  ## Security
  - Enable RLS on user_notifications
  - Users can only view and update their own notifications
  - Admins can create notifications for any user

  ## Indexes
  - Index on user_id and is_read for efficient queries
*/

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'system' CHECK (type IN ('ticket_update', 'subscription_change', 'payment', 'system', 'admin_message')),
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can create notifications for any user
CREATE POLICY "Admins can create notifications"
  ON user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_user_notification(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'system',
  notification_related_id uuid DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_notification_id uuid;
BEGIN
  -- Insert the notification
  INSERT INTO user_notifications (user_id, title, message, type, related_id)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_related_id)
  RETURNING id INTO new_notification_id;

  RETURN new_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_notification TO authenticated;

-- Trigger function to notify user when ticket status changes
CREATE OR REPLACE FUNCTION notify_user_on_ticket_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed or admin replied
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM create_user_notification(
      NEW.user_id,
      'Support Ticket Updated',
      'Your support ticket "' || NEW.subject || '" status changed to: ' || NEW.status,
      'ticket_update',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket updates
DROP TRIGGER IF EXISTS trigger_notify_ticket_update ON support_tickets;
CREATE TRIGGER trigger_notify_ticket_update
  AFTER UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_on_ticket_update();

-- Trigger function to notify user when admin replies to ticket
CREATE OR REPLACE FUNCTION notify_user_on_ticket_reply()
RETURNS TRIGGER AS $$
DECLARE
  ticket_user_id uuid;
  ticket_subject text;
BEGIN
  -- Only notify if it's a staff reply
  IF NEW.is_staff_reply = true THEN
    -- Get the ticket user_id and subject
    SELECT user_id, subject INTO ticket_user_id, ticket_subject
    FROM support_tickets
    WHERE id = NEW.ticket_id;

    -- Don't notify the admin who replied
    IF ticket_user_id IS NOT NULL AND ticket_user_id != NEW.user_id THEN
      PERFORM create_user_notification(
        ticket_user_id,
        'New Reply to Your Support Ticket',
        'An admin has replied to your ticket: "' || ticket_subject || '"',
        'ticket_update',
        NEW.ticket_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket replies
DROP TRIGGER IF EXISTS trigger_notify_ticket_reply ON ticket_messages;
CREATE TRIGGER trigger_notify_ticket_reply
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_on_ticket_reply();