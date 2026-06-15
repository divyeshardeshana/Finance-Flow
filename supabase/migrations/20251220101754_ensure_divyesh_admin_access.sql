/*
  # Ensure Admin Access for [ADMIN_EMAIL]

  ## Overview
  This migration verifies and ensures that [ADMIN_EMAIL] has proper admin access.
  It's safe to run multiple times (idempotent).

  ## Changes
  1. Updates user_profiles to ensure is_admin = true
  2. Sets admin_role = 'super_admin'
  3. Sets subscription_tier = 'premium'
  4. Only updates if the user exists

  ## Security
  - Only affects the specific admin user
  - Ensures consistent admin access
*/

DO $$
DECLARE
  target_user_id uuid;
  profile_exists boolean;
BEGIN
  -- Find the user ID from auth.users by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = '[ADMIN_EMAIL]'
  LIMIT 1;

  IF target_user_id IS NOT NULL THEN
    -- Check if profile exists
    SELECT EXISTS (
      SELECT 1 FROM user_profiles WHERE id = target_user_id
    ) INTO profile_exists;

    IF profile_exists THEN
      -- Update existing profile
      UPDATE user_profiles
      SET
        is_admin = true,
        admin_role = 'super_admin',
        subscription_tier = 'premium',
        updated_at = NOW()
      WHERE id = target_user_id;
      
      RAISE NOTICE 'Admin access updated for [ADMIN_EMAIL] (user_id: %)', target_user_id;
    ELSE
      -- Create profile if it doesn't exist
      INSERT INTO user_profiles (
        id,
        is_admin,
        admin_role,
        subscription_tier,
        user_type,
        average_monthly_income,
        income_type,
        risk_tolerance,
        onboarding_completed,
        full_name,
        email_alerts,
        currency,
        country,
        language,
        timezone,
        theme,
        created_at,
        updated_at
      ) VALUES (
        target_user_id,
        true,
        'super_admin',
        'premium',
        'individual',
        0,
        'regular',
        'moderate',
        true,
        'Admin User',
        'weekly',
        'USD',
        '',
        'en',
        'UTC',
        'light',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Admin profile created for [ADMIN_EMAIL] (user_id: %)', target_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'User [ADMIN_EMAIL] not found in auth.users - they may need to sign up first';
  END IF;
END $$;
