/*
  # Add Bill Reminders & Notifications System

  ## Overview
  Creates bill reminders with automatic categorization and browser notification preferences.
  This is a Paid Plan feature that helps users never miss a bill payment.

  ## New Tables Created

  ### 1. `bill_reminders`
  Recurring bill tracking with reminders:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `bill_name` (text) - Name of the bill
  - `amount` (numeric) - Bill amount
  - `due_date` (date) - Next due date
  - `category` (text) - Auto-categorized: utilities, credit_cards, subscriptions, other
  - `frequency` (text) - monthly, quarterly, yearly, custom
  - `reminder_days_before` (integer) - Days before due date to remind
  - `is_active` (boolean) - Whether reminder is active
  - `last_reminded_at` (timestamptz) - Last time user was reminded
  - `next_due_date` (date) - Calculated next due date
  - `auto_pay` (boolean) - Whether bill is on autopay
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `notification_preferences`
  User notification settings for browser notifications:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users, unique)
  - `browser_notifications_enabled` (boolean) - Master toggle
  - `reminder_time` (time) - Time of day to send reminders (e.g., 09:00:00)
  - `days_before_reminder` (integer) - Default days before due date
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own bill reminders
  - Users can only manage their own notification preferences

  ## Indexes
  - Index on user_id for efficient queries
  - Index on next_due_date for reminder checks
  - Index on is_active for filtering active reminders
*/

-- Create bill_reminders table
CREATE TABLE IF NOT EXISTS bill_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_name text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  category text DEFAULT 'other' CHECK (category IN ('utilities', 'credit_cards', 'subscriptions', 'other')),
  frequency text DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'custom')),
  reminder_days_before integer DEFAULT 3 CHECK (reminder_days_before >= 0 AND reminder_days_before <= 30),
  is_active boolean DEFAULT true,
  last_reminded_at timestamptz,
  next_due_date date NOT NULL,
  auto_pay boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bill reminders"
  ON bill_reminders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bill reminders"
  ON bill_reminders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bill reminders"
  ON bill_reminders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bill reminders"
  ON bill_reminders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_notifications_enabled boolean DEFAULT true,
  reminder_time time DEFAULT '09:00:00',
  days_before_reminder integer DEFAULT 3 CHECK (days_before_reminder >= 0 AND days_before_reminder <= 30),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bill_reminders_user_id ON bill_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_next_due_date ON bill_reminders(next_due_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bill_reminders_active ON bill_reminders(is_active, user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Function to auto-categorize bills based on keywords
CREATE OR REPLACE FUNCTION auto_categorize_bill()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for utility keywords
  IF NEW.bill_name ~* '(electric|electricity|water|gas|internet|phone|mobile|cable|utility)' THEN
    NEW.category := 'utilities';
  -- Check for credit card keywords
  ELSIF NEW.bill_name ~* '(visa|mastercard|amex|credit card|discover|card payment)' THEN
    NEW.category := 'credit_cards';
  -- Check for subscription keywords
  ELSIF NEW.bill_name ~* '(netflix|spotify|amazon prime|hulu|disney|subscription|membership|youtube premium|apple music)' THEN
    NEW.category := 'subscriptions';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-categorization
DROP TRIGGER IF EXISTS auto_categorize_bill_trigger ON bill_reminders;
CREATE TRIGGER auto_categorize_bill_trigger
  BEFORE INSERT OR UPDATE ON bill_reminders
  FOR EACH ROW
  EXECUTE FUNCTION auto_categorize_bill();

-- Function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.frequency = 'monthly' THEN
    NEW.next_due_date := NEW.due_date + INTERVAL '1 month';
  ELSIF NEW.frequency = 'quarterly' THEN
    NEW.next_due_date := NEW.due_date + INTERVAL '3 months';
  ELSIF NEW.frequency = 'yearly' THEN
    NEW.next_due_date := NEW.due_date + INTERVAL '1 year';
  ELSE
    NEW.next_due_date := NEW.due_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for next due date calculation (only on insert)
DROP TRIGGER IF EXISTS calculate_next_due_date_trigger ON bill_reminders;
CREATE TRIGGER calculate_next_due_date_trigger
  BEFORE INSERT ON bill_reminders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_next_due_date();