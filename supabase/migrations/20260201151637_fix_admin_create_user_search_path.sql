/*
  # Fix Admin Create User Function Search Path

  1. Changes
    - Update `admin_create_user_account` function to include `extensions` schema in search path
    - This allows the function to access `gen_salt` and `crypt` from pgcrypto extension
    - Fixes error: "function gen_salt(unknown) does not exist"

  2. Technical Details
    - Changes `SET search_path = public` to `SET search_path = public, extensions`
    - No other changes to function logic or security
    - Maintains SECURITY DEFINER for proper privilege elevation
*/

-- Drop and recreate the function with correct search path
CREATE OR REPLACE FUNCTION admin_create_user_account(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_subscription_tier TEXT DEFAULT 'free',
  p_is_admin BOOLEAN DEFAULT false,
  p_admin_role TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'US',
  p_currency TEXT DEFAULT 'USD',
  p_user_type TEXT DEFAULT 'individual'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_calling_user_id UUID;
  v_is_calling_user_admin BOOLEAN;
  v_new_user_id UUID;
  v_error_message TEXT;
BEGIN
  -- Get the calling user ID
  v_calling_user_id := auth.uid();
  
  -- Check if calling user is authenticated
  IF v_calling_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'details', 'You must be signed in to perform this action'
    );
  END IF;

  -- Check if calling user is an admin
  SELECT is_admin INTO v_is_calling_user_admin
  FROM user_profiles
  WHERE id = v_calling_user_id;

  IF v_is_calling_user_admin IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied',
      'details', 'Admin privileges required to create users'
    );
  END IF;

  -- Validate input parameters
  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Validation failed',
      'details', 'Email is required'
    );
  END IF;

  IF p_password IS NULL OR LENGTH(p_password) < 6 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Validation failed',
      'details', 'Password must be at least 6 characters'
    );
  END IF;

  IF p_full_name IS NULL OR p_full_name = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Validation failed',
      'details', 'Full name is required'
    );
  END IF;

  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email already exists',
      'details', 'A user with this email already exists'
    );
  END IF;

  -- Generate new user ID
  v_new_user_id := gen_random_uuid();

  BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      email_change_token_current,
      email_change_token_new
    ) VALUES (
      v_new_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', p_full_name),
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      ''
    );

    -- Create user profile
    INSERT INTO user_profiles (
      id,
      email,
      full_name,
      user_type,
      subscription_tier,
      is_admin,
      admin_role,
      country,
      currency,
      onboarding_completed
    ) VALUES (
      v_new_user_id,
      p_email,
      p_full_name,
      p_user_type,
      p_subscription_tier,
      p_is_admin,
      CASE WHEN p_is_admin THEN p_admin_role ELSE NULL END,
      p_country,
      p_currency,
      false
    );

    -- Log admin activity
    INSERT INTO admin_activity_log (
      admin_user_id,
      action_type,
      target_type,
      target_id,
      action_details
    ) VALUES (
      v_calling_user_id,
      'create_user',
      'user',
      v_new_user_id,
      jsonb_build_object(
        'email', p_email,
        'subscription_tier', p_subscription_tier,
        'is_admin', p_is_admin,
        'method', 'database_function'
      )
    );

    -- Send welcome notification
    PERFORM create_user_notification(
      v_new_user_id,
      'Welcome!',
      'Your account has been created by an administrator. You can now sign in with your credentials.',
      'system',
      NULL
    );

    -- Return success
    RETURN jsonb_build_object(
      'success', true,
      'user_id', v_new_user_id,
      'email', p_email,
      'message', 'User created successfully'
    );

  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Duplicate entry',
        'details', 'A user with this email already exists'
      );
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Database error',
        'details', v_error_message
      );
  END;
END;
$$;

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION admin_create_user_account TO authenticated;

-- Update comment
COMMENT ON FUNCTION admin_create_user_account IS 'Allows admins to create new user accounts with full profile setup. Validates admin privileges and handles all user creation steps atomically. Fixed to include extensions schema in search path.';