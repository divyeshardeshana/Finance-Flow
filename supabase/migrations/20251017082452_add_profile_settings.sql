/*
  # Add Profile Settings and Preferences

  ## Overview
  Adds comprehensive profile settings including preferences for notifications,
  currency, language, photo, and custom transaction fields.

  ## Table Updates

  ### 1. Update `user_profiles` table
  Add new profile fields:
  - `full_name` (text) - User's full name
  - `email_alerts` (text) - daily, weekly, none
  - `currency` (text) - USD, EUR, GBP, INR, etc.
  - `country` (text) - User's country
  - `photo_url` (text) - Profile photo URL
  - `language` (text) - en, hi, ar, es, zh
  - `timezone` (text) - User's timezone
  - `theme` (text) - light or dark

  ## New Tables Created

  ### 1. `custom_transaction_types`
  User-defined transaction types:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `type_name` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on custom_transaction_types table
  - Users can only manage their own custom types

  ## Indexes
  - Index on user_id for efficient queries
*/

-- Add new columns to user_profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN full_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email_alerts'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email_alerts text DEFAULT 'weekly' CHECK (email_alerts IN ('daily', 'weekly', 'none'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'currency'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN country text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN photo_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN language text DEFAULT 'en' CHECK (language IN ('en', 'hi', 'ar', 'es', 'zh'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN timezone text DEFAULT 'UTC';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'theme'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark'));
  END IF;
END $$;

-- Create custom_transaction_types table
CREATE TABLE IF NOT EXISTS custom_transaction_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type_name)
);

ALTER TABLE custom_transaction_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom types"
  ON custom_transaction_types FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own custom types"
  ON custom_transaction_types FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own custom types"
  ON custom_transaction_types FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own custom types"
  ON custom_transaction_types FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_custom_transaction_types_user_id 
  ON custom_transaction_types(user_id) WHERE is_active = true;