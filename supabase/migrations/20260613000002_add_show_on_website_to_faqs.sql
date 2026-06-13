-- Add show_on_website column to faq_articles so admins can control
-- which FAQs appear on the public /faq page

ALTER TABLE faq_articles
  ADD COLUMN IF NOT EXISTS show_on_website boolean NOT NULL DEFAULT false;

-- Allow public (unauthenticated) read of FAQs marked for website
DROP POLICY IF EXISTS "Public can read website faqs" ON faq_articles;

CREATE POLICY "Public can read website faqs"
  ON faq_articles FOR SELECT
  TO anon
  USING (show_on_website = true AND is_published = true);
