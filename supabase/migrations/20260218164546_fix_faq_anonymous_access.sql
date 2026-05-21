/*
  # Fix FAQ Articles Anonymous Access

  ## Problem
  The "Anyone can view published FAQ articles" RLS policy only allowed `authenticated` role,
  meaning unauthenticated public visitors couldn't see FAQ articles on the Help Center page.

  ## Changes
  - Drop the existing SELECT policy that restricted to authenticated users
  - Create a new SELECT policy that allows both `anon` and `authenticated` roles to view published FAQs

  ## Security
  - Only published articles (is_published = true) are visible
  - No write access is granted to anonymous users
  - Admin management policies remain unchanged
*/

DROP POLICY IF EXISTS "Anyone can view published FAQ articles" ON faq_articles;

CREATE POLICY "Anyone can view published FAQ articles"
  ON faq_articles
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
