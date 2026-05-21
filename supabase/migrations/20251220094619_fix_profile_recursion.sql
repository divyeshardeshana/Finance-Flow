/*
  # Fix Profile Update Infinite Recursion

  ## Overview
  Fixes the infinite recursion error when users update their profiles by properly
  configuring the is_admin_user() function to bypass RLS policies.

  ## Problem
  The current is_admin_user() function queries user_profiles table, which triggers
  RLS policies. These policies call is_admin_user() again, creating infinite recursion.

  ## Solution
  1. Drop existing problematic policies
  2. Recreate is_admin_user() with proper security settings to bypass RLS
  3. Recreate policies with correct configuration

  ## Security
  - Maintains user data isolation
  - Admin access preserved without recursion
  - Uses SECURITY DEFINER to bypass RLS in function context
*/

-- Step 1: Drop all existing RLS policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Step 2: Drop and recreate the is_admin_user function with proper RLS bypass
DROP FUNCTION IF EXISTS is_admin_user(uuid);

CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  is_admin_result boolean;
BEGIN
  -- Query directly with RLS disabled in SECURITY DEFINER context
  SELECT is_admin INTO is_admin_result
  FROM user_profiles
  WHERE id = user_id
  LIMIT 1;

  RETURN COALESCE(is_admin_result, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Step 3: Create simple, non-recursive policies for regular users

-- Allow users to view their own profile (no admin check here)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile (no admin check here to avoid recursion)
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

-- Step 4: Create separate admin policies that use the function

-- Admin can view all profiles (separate policy, evaluated after user policy)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- Admin can update any profile (separate policy)
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Add helpful comment
COMMENT ON FUNCTION is_admin_user IS 'Check if a user has admin privileges. Uses SECURITY DEFINER to bypass RLS and prevent recursion.';
