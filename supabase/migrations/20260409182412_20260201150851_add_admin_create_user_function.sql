/*
  # Add Database Function for Admin User Creation

  1. New Functions
    - `admin_create_user_account`: Secure function to create users from admin panel
      - Validates calling user is an admin
      - Creates auth user using auth.users table
      - Creates user profile
      - Logs admin activity
      - Sends notification to new user
      - Returns success/failure with detailed information

  2. Security
    - Function uses SECURITY DEFINER to elevate privileges
    - Validates admin status before any operations
    - Includes comprehensive error handling
    - Logs all actions for audit trail

  3. Benefits
    - Bypasses JWT token validation issues
    - More reliable than Edge Functions
    - Better error handling and reporting
    - Atomic operations with proper rollback
*/

-- Function to create a user as admin
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
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_calling_user_id UUID;
  v_is_calling_user_admin BOOLEAN;
  v_new_user_id UUID;
  v_error_message TEXT;
BEGIN
  v_calling_user_id := auth.uid();
  
  IF v_calling_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'details', 'You must be signed in to perform this action'
    );
  END IF;

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

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email already exists',
      'details', 'A user with this email already exists'
    );
  END IF;

  v_new_user_id := gen_random_uuid();

  BEGIN
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

    PERFORM create_user_notification(
      v_new_user_id,
      'Welcome!',
      'Your account has been created by an administrator. You can now sign in with your credentials.',
      'system',
      NULL
    );

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

GRANT EXECUTE ON FUNCTION admin_create_user_account TO authenticated;
