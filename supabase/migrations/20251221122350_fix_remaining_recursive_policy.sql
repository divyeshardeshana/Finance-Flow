/*
  # Remove Remaining Recursive Policy
  
  ## Overview
  This migration removes the old "Admins can view all user profiles" policy
  that was not caught by the previous cleanup. This policy uses a recursive
  subquery that causes infinite recursion errors.
  
  ## Problem
  The policy "Admins can view all user profiles" contains:
  EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.is_admin = true)
  
  This causes recursion because it queries user_profiles while evaluating
  RLS policies on user_profiles.
  
  ## Solution
  Drop this old policy. The new policies (admin_select_all, user_select_own, etc.)
  created in the fix_recursion_final migration are sufficient and non-recursive.
  
  ## Security
  - No security impact - the correct policies remain in place
  - Users can still access their own profiles
  - Admins can still access all profiles via admin_select_all policy
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;

-- Verify that only the correct policies remain by listing them
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Current user_profiles policies after cleanup:';
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'user_profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - %', policy_record.policyname;
  END LOOP;
END $$;
