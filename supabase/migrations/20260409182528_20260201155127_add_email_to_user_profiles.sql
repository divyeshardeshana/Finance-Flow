/*
  # Add Email Column to User Profiles

  1. Purpose
    - Add email column to user_profiles table
    - Store user email for quick access without joining auth.users
    - Fix user creation error in admin panel

  2. Changes
    - Add email column to user_profiles
    - Make it nullable for existing users
    - Add index for faster lookups

  3. Security
    - Email is already stored in auth.users
    - This is a denormalized copy for performance
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN email TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

UPDATE user_profiles
SET email = auth.users.email
FROM auth.users
WHERE user_profiles.id = auth.users.id
  AND user_profiles.email IS NULL;
