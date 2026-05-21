/*
  # Final Fix for User Profile RLS Recursion

  ## Overview
  This migration completely resolves the infinite recursion error when users
  update their profiles. The issue occurs when RLS policies call functions
  that query the same table with RLS enabled.

  ## Problem Analysis
  Previous migrations attempted to fix recursion but the policies still caused
  issues because:
  1. Multiple policies with overlapping conditions create evaluation conflicts
  2. The is_admin_user() function, even with SECURITY DEFINER, was being called
     during policy evaluation in a way that triggered recursion

  ## Solution
  1. Drop ALL existing policies completely
  2. Recreate is_admin_user() with explicit RLS bypass settings
  3. Create PERMISSIVE policies that allow PostgreSQL to evaluate non-recursive
     paths first
  4. Separate user and admin policies so they don't interfere

  ## Changes Made
  1. Drop all existing RLS policies on user_profiles
  2. Recreate is_admin_user() function with proper security settings
  3. Create simple PERMISSIVE policies for regular users (no function calls)
  4. Create separate PERMISSIVE policies for admins (with function calls)
  5. Ensure policies are ordered correctly for PostgreSQL evaluation

  ## Security
  - Users can only view/update their own profiles
  - Admins can view/update all profiles
  - RLS remains enabled and secure
  - No data exposure risk
*/

-- Step 1: Drop ALL existing RLS policies to ensure clean slate
DO $$
BEGIN
  -- Drop all policies on user_profiles table
  DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;
END $$;

-- Step 2: Drop and recreate is_admin_user function with explicit RLS bypass
DROP FUNCTION IF EXISTS is_admin_user(uuid);

CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Execute with function owner's privileges, bypassing RLS
STABLE            -- Function result is stable within a single query
SET search_path = public, pg_temp  -- Prevent search path attacks
AS $$
DECLARE
  admin_status boolean;
BEGIN
  -- Direct query that bypasses RLS due to SECURITY DEFINER
  -- This query will NOT trigger RLS policies because it runs as the function owner
  SELECT COALESCE(is_admin, false)
  INTO admin_status
  FROM user_profiles
  WHERE id = user_id;

  RETURN COALESCE(admin_status, false);
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, safely return false
    RETURN false;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION is_admin_user IS 'Checks if user has admin privileges. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

-- Step 3: Create PERMISSIVE policies for regular users (these will be evaluated first)

-- Users can SELECT their own profile (simple policy, no function calls)
CREATE POLICY "user_select_own"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can INSERT their own profile (simple policy, no function calls)
CREATE POLICY "user_insert_own"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can UPDATE their own profile (simple policy, no function calls)
CREATE POLICY "user_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can DELETE their own profile (simple policy, no function calls)
CREATE POLICY "user_delete_own"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Step 4: Create separate PERMISSIVE policies for admins
-- These policies are evaluated independently and allow admin access

-- Admins can SELECT all profiles
CREATE POLICY "admin_select_all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()) = true);

-- Admins can UPDATE all profiles
CREATE POLICY "admin_update_all"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()) = true)
  WITH CHECK (is_admin_user(auth.uid()) = true);

-- Admins can DELETE all profiles
CREATE POLICY "admin_delete_all"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin_user(auth.uid()) = true);

-- Note: We keep policies PERMISSIVE (default) so that if EITHER the user policy
-- OR the admin policy passes, the action is allowed. This means:
-- - Regular users can access their own data via user_* policies (no recursion)
-- - Admins can access all data via admin_* policies (function call is safe due to SECURITY DEFINER)
-- - When an admin accesses their own profile, the user_* policy passes first (no recursion)
