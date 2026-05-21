/*
  # Fix Public Access to Pricing Information

  ## Problem
  The landing page displays pricing to unauthenticated visitors, but the RLS policy 
  on subscription_tiers only allows authenticated users to read the data. This causes 
  the app to fall back to hardcoded defaults instead of showing admin-updated values.

  ## Solution
  Update the RLS policy to allow public (unauthenticated) read access to active 
  subscription tiers. This is safe because:
  - Pricing information is meant to be public
  - Policy only allows SELECT (read-only)
  - Only active tiers are visible (is_active = true)
  - Write operations remain restricted to admins only

  ## Changes
  1. Drop the old restrictive policy that only allowed authenticated users
  2. Create new policy allowing anyone (including anonymous users) to view active tiers
  3. Admin write policies remain unchanged
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view active subscription tiers" ON subscription_tiers;

-- Create new policy allowing public read access to active tiers
CREATE POLICY "Public can view active subscription tiers"
  ON subscription_tiers FOR SELECT
  TO public
  USING (is_active = true);
