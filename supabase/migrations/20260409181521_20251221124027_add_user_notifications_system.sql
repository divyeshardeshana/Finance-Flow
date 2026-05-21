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

CREATE POLICY "Users can view own notifications" ON user_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON user_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can create notifications" ON user_notifications FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true));
CREATE POLICY "Admins can view all notifications" ON user_notifications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true));

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);

CREATE OR REPLACE FUNCTION create_user_notification(target_user_id uuid, notification_title text, notification_message text, notification_type text DEFAULT 'system', notification_related_id uuid DEFAULT NULL)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE new_notification_id uuid;
BEGIN
  INSERT INTO user_notifications (user_id, title, message, type, related_id)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_related_id)
  RETURNING id INTO new_notification_id;
  RETURN new_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_notification TO authenticated;

CREATE OR REPLACE FUNCTION notify_user_on_ticket_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM create_user_notification(NEW.user_id, 'Support Ticket Updated', 'Your support ticket "' || NEW.subject || '" status changed to: ' || NEW.status, 'ticket_update', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_ticket_update ON support_tickets;
CREATE TRIGGER trigger_notify_ticket_update AFTER UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION notify_user_on_ticket_update();

CREATE OR REPLACE FUNCTION notify_user_on_ticket_reply()
RETURNS TRIGGER AS $$
DECLARE ticket_user_id uuid; ticket_subject text;
BEGIN
  IF NEW.is_staff_reply = true THEN
    SELECT user_id, subject INTO ticket_user_id, ticket_subject FROM support_tickets WHERE id = NEW.ticket_id;
    IF ticket_user_id IS NOT NULL AND ticket_user_id != NEW.user_id THEN
      PERFORM create_user_notification(ticket_user_id, 'New Reply to Your Support Ticket', 'An admin has replied to your ticket: "' || ticket_subject || '"', 'ticket_update', NEW.ticket_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_ticket_reply ON ticket_messages;
CREATE TRIGGER trigger_notify_ticket_reply AFTER INSERT ON ticket_messages FOR EACH ROW EXECUTE FUNCTION notify_user_on_ticket_reply();
