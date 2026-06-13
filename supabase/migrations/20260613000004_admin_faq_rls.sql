-- Ensure admins can INSERT, UPDATE, DELETE faq_articles

DROP POLICY IF EXISTS "Admins can manage faqs" ON faq_articles;
DROP POLICY IF EXISTS "Admins can insert faqs" ON faq_articles;
DROP POLICY IF EXISTS "Admins can update faqs" ON faq_articles;
DROP POLICY IF EXISTS "Admins can delete faqs" ON faq_articles;

CREATE POLICY "Admins can insert faqs"
  ON faq_articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update faqs"
  ON faq_articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete faqs"
  ON faq_articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );

-- Authenticated users can read all faqs (for admin panel)
DROP POLICY IF EXISTS "Authenticated users can read faqs" ON faq_articles;
CREATE POLICY "Authenticated users can read faqs"
  ON faq_articles FOR SELECT
  TO authenticated
  USING (true);
