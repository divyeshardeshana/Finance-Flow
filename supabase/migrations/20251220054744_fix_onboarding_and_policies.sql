/*
  # Fix Onboarding Requirement and RLS Policy Recursion

  ## Overview
  Removes the forced onboarding requirement and fixes infinite recursion in RLS policies
  by simplifying user_profiles policies to not create circular references.

  ## Changes

  ### 1. Update Existing User Profiles
  - Set onboarding_completed = true for all existing users
  - This allows immediate access to the dashboard after signup

  ### 2. Fix Auto-Create Trigger
  - Update handle_new_user() to set onboarding_completed = true by default
  - New users can immediately access the app without forced onboarding

  ### 3. Fix RLS Policies on user_profiles
  - Drop all existing policies on user_profiles
  - Recreate simple, non-recursive policies
  - Ensure admin checks don't cause circular references
  - Users can view/update their own profiles without recursion

  ## Security
  - Maintains user data isolation (users can only access their own profiles)
  - Admin access preserved through separate policy without recursion
  - All policies use simple auth.uid() checks
*/

-- Step 1: Update all existing users to mark onboarding as completed
UPDATE user_profiles
SET onboarding_completed = true
WHERE onboarding_completed = false OR onboarding_completed IS NULL;

-- Step 2: Drop and recreate the handle_new_user trigger function with onboarding_completed = true
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
    'individual',
    0,
    'regular',
    'moderate',
    true,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'weekly',
    'USD',
    '',
    '',
    'en',
    'UTC',
    'light',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 3: Drop all existing RLS policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Step 4: Create simple, non-recursive policies for user_profiles

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile (simple, no recursion)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create a separate function for admin checks to avoid recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id
    AND is_admin = true
  );
$$;

-- Admin can view all profiles (using function to avoid direct recursion)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR is_admin_user(auth.uid())
  );

-- Admin can update any profile (using function to avoid direct recursion)
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR is_admin_user(auth.uid())
  )
  WITH CHECK (
    auth.uid() = id OR is_admin_user(auth.uid())
  );

-- Add helpful comment
COMMENT ON FUNCTION is_admin_user IS 'Check if a user has admin privileges without causing policy recursion';
