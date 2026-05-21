/*
  # Auto-Create User Profile Trigger

  ## Overview
  Creates a database trigger that automatically creates a user_profile record 
  when a new user signs up in auth.users. This ensures every user has a profile
  and prevents login loops where users are stuck in onboarding.

  ## Changes

  ### 1. New Function: `handle_new_user()`
  Creates a trigger function that:
  - Automatically creates a user_profile record for new users
  - Sets default values for all required fields
  - Sets onboarding_completed to false (users must complete onboarding)
  - Uses SECURITY DEFINER to bypass RLS policies during automatic creation

  ### 2. New Trigger: `on_auth_user_created`
  Attaches to auth.users table to execute after INSERT operations
  - Runs after each new user registration
  - Calls handle_new_user() function
  - Ensures profile is created before user first login

  ### 3. Data Fix
  Creates user_profiles for any existing users who don't have profiles yet
  - Identifies users in auth.users without corresponding user_profiles
  - Creates minimal profile entries with sensible defaults
  - Allows these users to complete onboarding on next login

  ## Security
  - Function uses SECURITY DEFINER to create profiles (bypasses RLS)
  - Only creates profiles for authenticated users in auth.users
  - Sets onboarding_completed to false to require user input
  - Function has proper error handling to prevent signup blocking

  ## Important Notes
  - All new users will automatically get a user_profile record
  - Users must still complete the onboarding flow (onboarding_completed = false)
  - Existing users without profiles will get default profiles created
  - Trigger uses proper error handling to avoid blocking signups
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    user_type,
    average_monthly_income,
    income_type,
    risk_tolerance,
    onboarding_completed,
    full_name,
    email_alerts,
    currency,
    country,
    photo_url,
    language,
    timezone,
    theme,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'individual',  -- Default user type
    0,             -- Default income
    'regular',     -- Default income type
    'moderate',    -- Default risk tolerance
    false,         -- Must complete onboarding
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'weekly',      -- Default email alerts
    'USD',         -- Default currency
    '',            -- Empty country (user will set)
    '',            -- No photo initially
    'en',          -- Default language
    'UTC',         -- Default timezone
    'light',       -- Default theme
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user signup
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix existing users who don't have profiles
-- This creates profiles for users who signed up before the trigger was added
INSERT INTO public.user_profiles (
  id,
  user_type,
  average_monthly_income,
  income_type,
  risk_tolerance,
  onboarding_completed,
  full_name,
  email_alerts,
  currency,
  country,
  photo_url,
  language,
  timezone,
  theme,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'individual',
  0,
  'regular',
  'moderate',
  false,  -- Force these users through onboarding
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'weekly',
  'USD',
  '',
  '',
  'en',
  'UTC',
  'light',
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;