/*
  # Fix Admin Access for [ADMIN_EMAIL]

  ## Overview
  Ensures that the user with email [ADMIN_EMAIL] has proper admin access
  and can see the Admin Panel option in the user menu.

  ## Changes
  1. Updates user_profiles table to set is_admin = true and admin_role = 'super_admin'
  2. Only updates if the user exists in auth.users table
  3. Safe to run multiple times (idempotent)

  ## Security
  - Only affects the specific user account
  - Grants full super_admin privileges
*/

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user ID from auth.users by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = '[ADMIN_EMAIL]'
  LIMIT 1;

  -- If user exists, update their profile
  IF target_user_id IS NOT NULL THEN
    -- Update the user_profiles table
    UPDATE user_profiles
    SET
      is_admin = true,
      admin_role = 'super_admin',
      subscription_tier = 'premium'
    WHERE id = target_user_id;

    -- Log the action
    RAISE NOTICE 'Admin access granted to user: %', target_user_id;
  ELSE
    RAISE NOTICE 'User [ADMIN_EMAIL] not found in auth.users';
  END IF;
END $$;
