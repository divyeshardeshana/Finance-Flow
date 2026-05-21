/*
  # Fix FAQ Articles Anonymous Access

  Updates the FAQ SELECT policy to allow both anon and authenticated roles to view published FAQs.
*/

DROP POLICY IF EXISTS "Anyone can view published FAQ articles" ON faq_articles;

CREATE POLICY "Anyone can view published FAQ articles"
  ON faq_articles
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
