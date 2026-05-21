/*
  # Fix Public Access to Pricing Information

  Updates RLS to allow public (unauthenticated) read access to active subscription tiers.
  Pricing information is meant to be public, so this is safe.
*/

DROP POLICY IF EXISTS "Anyone can view active subscription tiers" ON subscription_tiers;

CREATE POLICY "Public can view active subscription tiers"
  ON subscription_tiers FOR SELECT
  TO public
  USING (is_active = true);
