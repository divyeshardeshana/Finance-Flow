/*
  # Reset Super Admin Password

  ## Overview
  Resets the password for divyesh3@gmail.com super admin user.

  ## Changes
  1. Updates password in auth.users table
  2. Sets a secure temporary password: Admin@2024!Secure

  ## Credentials
  - Username: divyesh3@gmail.com
  - Password: Admin@2024!Secure
  - User should change password after first login

  ## Security
  - Only affects the specific user account
  - Uses secure password hashing
*/

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user ID from auth.users by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'divyesh3@gmail.com'
  LIMIT 1;

  -- If user exists, update their password
  IF target_user_id IS NOT NULL THEN
    -- Update the password hash in auth.users
    -- Supabase uses the crypt extension for password hashing
    UPDATE auth.users
    SET
      encrypted_password = crypt('Admin@2024!Secure', gen_salt('bf')),
      updated_at = now()
    WHERE id = target_user_id;

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'PASSWORD RESET SUCCESSFUL';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Username: divyesh3@gmail.com';
    RAISE NOTICE 'Password: Admin@2024!Secure';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Please change password after first login';
    RAISE NOTICE '==============================================';
  ELSE
    RAISE EXCEPTION 'User divyesh3@gmail.com not found in auth.users';
  END IF;
END $$;
