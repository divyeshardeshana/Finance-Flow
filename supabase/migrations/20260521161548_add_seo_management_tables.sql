/*
  # SEO Management System

  Creates the seo_pages table for managing meta tags and SEO data per page.
  This migration was missing from the applied migrations list.
*/

CREATE TABLE IF NOT EXISTS seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text UNIQUE NOT NULL,
  page_name text NOT NULL,
  page_path text NOT NULL,
  meta_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  meta_keywords text NOT NULL DEFAULT '',
  og_title text NOT NULL DEFAULT '',
  og_description text NOT NULL DEFAULT '',
  og_image_url text NOT NULL DEFAULT '',
  twitter_title text NOT NULL DEFAULT '',
  twitter_description text NOT NULL DEFAULT '',
  twitter_image_url text NOT NULL DEFAULT '',
  canonical_url text NOT NULL DEFAULT '',
  structured_data jsonb,
  is_indexable boolean NOT NULL DEFAULT true,
  priority numeric(2,1) NOT NULL DEFAULT 0.5 CHECK (priority >= 0.0 AND priority <= 1.0),
  change_frequency text NOT NULL DEFAULT 'monthly' CHECK (change_frequency IN ('always','hourly','daily','weekly','monthly','yearly','never')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seo_pages"
  ON seo_pages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert seo_pages"
  ON seo_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update seo_pages"
  ON seo_pages FOR UPDATE
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

CREATE POLICY "Admins can delete seo_pages"
  ON seo_pages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION update_seo_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seo_pages_updated_at
  BEFORE UPDATE ON seo_pages
  FOR EACH ROW EXECUTE FUNCTION update_seo_pages_updated_at();

INSERT INTO seo_pages (page_key, page_name, page_path, meta_title, meta_description, meta_keywords, og_title, og_description, og_image_url, twitter_title, twitter_description, is_indexable, priority, change_frequency, structured_data) VALUES

('home', 'Home / Landing', '/', 'FinanceFlow AI — Smart Personal Finance & Budgeting App', 'Take control of your money with FinanceFlow AI. AI-powered budgeting, investment tracking, retirement planning, and financial insights — all in one platform. Start free today.', 'personal finance app, budgeting app, AI financial assistant, investment tracker, retirement planning, money management, expense tracking, financial wellness', 'FinanceFlow AI — Smart Personal Finance & Budgeting App', 'Take control of your money with FinanceFlow AI. AI-powered budgeting, investment tracking, retirement planning, and financial insights — all in one platform.', 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1200', 'FinanceFlow AI — Smart Personal Finance & Budgeting App', 'Take control of your money with FinanceFlow AI. AI-powered budgeting, investment tracking, retirement planning, and financial insights.', true, 1.0, 'weekly', '{"@context":"https://schema.org","@type":"WebApplication","name":"FinanceFlow AI","description":"AI-powered personal finance platform for budgeting, investment tracking, and retirement planning","url":"https://app.financeflow.ai","applicationCategory":"FinanceApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}'::jsonb),

('about', 'About Us', '/about', 'About FinanceFlow AI — Our Mission & Team', 'Learn about FinanceFlow AI — the team building the smartest personal finance platform. Our mission is to make financial wellness accessible to everyone, everywhere.', 'about FinanceFlow AI, personal finance company, financial wellness mission, fintech team, money management platform', 'About FinanceFlow AI — Our Mission & Team', 'Learn about FinanceFlow AI — the team building the smartest personal finance platform. Our mission is to make financial wellness accessible to everyone, everywhere.', '', 'About FinanceFlow AI — Our Mission & Team', 'Learn about the FinanceFlow AI team and our mission to make financial wellness accessible to everyone.', true, 0.6, 'monthly', NULL),

('features', 'Features', '/features', 'FinanceFlow AI Features — Budgeting, Investing, AI Advisor & More', 'Explore FinanceFlow AI features: smart budgeting, expense tracking, AI financial assistant, investment portfolio management, retirement planning, net worth tracking, bill reminders, and more.', 'budgeting features, AI financial advisor, expense tracking, investment portfolio, retirement planner, net worth tracker, bill reminders, financial literacy, savings goals', 'FinanceFlow AI Features — Budgeting, Investing, AI Advisor & More', 'Explore all FinanceFlow AI features: smart budgeting, expense tracking, AI financial assistant, investment portfolio, retirement planning, and more.', '', 'FinanceFlow AI Features — Everything You Need to Manage Money', 'Explore FinanceFlow AI features: budgeting, expense tracking, AI advisor, investment tracking, and retirement planning.', true, 0.8, 'monthly', NULL),

('pricing', 'Pricing', '/pricing', 'FinanceFlow AI Pricing — Free, Pro & Enterprise Plans', 'Compare FinanceFlow AI pricing plans. Start free with core budgeting tools, or upgrade to Pro for AI-powered insights, unlimited transactions, investment tracking, and priority support.', 'FinanceFlow pricing, personal finance app pricing, budgeting app plans, free financial app, pro finance subscription, finance app cost', 'FinanceFlow AI Pricing — Free, Pro & Enterprise Plans', 'Compare FinanceFlow AI pricing plans. Start free with core budgeting tools, or upgrade to Pro for AI insights and advanced features.', '', 'FinanceFlow AI Pricing — Free & Pro Plans', 'Compare pricing plans for FinanceFlow AI. Start free or unlock AI-powered financial management with Pro.', true, 0.9, 'weekly', '{"@context":"https://schema.org","@type":"Product","name":"FinanceFlow AI","description":"AI-powered personal finance management platform","offers":[{"@type":"Offer","name":"Free Plan","price":"0","priceCurrency":"USD"},{"@type":"Offer","name":"Pro Plan","price":"9.99","priceCurrency":"USD"}]}'::jsonb),

('blog', 'Blog', '/blog', 'FinanceFlow AI Blog — Personal Finance Tips, Guides & Insights', 'Read expert personal finance articles on budgeting, investing, debt management, retirement planning, credit scores, and more. Practical guides to help you build lasting wealth.', 'personal finance blog, budgeting tips, investing guides, debt management, retirement planning, credit score tips, financial literacy, money saving tips', 'FinanceFlow AI Blog — Personal Finance Tips & Guides', 'Expert personal finance articles on budgeting, investing, debt management, retirement planning, and building wealth.', '', 'FinanceFlow AI Blog — Personal Finance Tips & Guides', 'Read expert personal finance articles on budgeting, investing, retirement planning, and wealth building.', true, 0.9, 'daily', '{"@context":"https://schema.org","@type":"Blog","name":"FinanceFlow AI Blog","description":"Expert personal finance articles on budgeting, investing, and wealth building","url":"https://app.financeflow.ai/blog"}'::jsonb),

('contact', 'Contact Us', '/contact', 'Contact FinanceFlow AI — Get Help & Support', 'Have questions about FinanceFlow AI? Contact our support team. We are here to help with account issues, billing questions, feature requests, and general inquiries.', 'contact FinanceFlow, customer support, help desk, finance app support, contact us', 'Contact FinanceFlow AI — Get Help & Support', 'Have questions about FinanceFlow AI? Contact our team for account help, billing questions, or general inquiries.', '', 'Contact FinanceFlow AI Support', 'Contact FinanceFlow AI support for help with your account, billing, or any questions.', true, 0.4, 'monthly', NULL),

('privacy', 'Privacy Policy', '/privacy', 'Privacy Policy — FinanceFlow AI Data Protection', 'Read the FinanceFlow AI Privacy Policy. We are committed to protecting your personal and financial data with bank-level security and full GDPR compliance.', 'FinanceFlow privacy policy, data protection, GDPR compliance, financial data security', 'Privacy Policy — FinanceFlow AI', 'Read the FinanceFlow AI Privacy Policy. We protect your personal and financial data with bank-level security.', '', 'FinanceFlow AI Privacy Policy', 'Read how FinanceFlow AI protects your personal and financial data.', true, 0.3, 'yearly', NULL),

('currency-converter', 'Currency Converter', '/currency-converter', 'Free Currency Converter — Real-Time Exchange Rates | FinanceFlow AI', 'Convert currencies instantly with FinanceFlow AI''s free real-time currency converter. Get up-to-date exchange rates for 150+ global currencies including USD, EUR, GBP, JPY, INR, and more.', 'currency converter, exchange rate, real-time forex, USD to EUR, currency exchange, free currency calculator, foreign exchange rates, live exchange rates', 'Free Currency Converter — Real-Time Exchange Rates', 'Convert currencies instantly with real-time exchange rates for 150+ global currencies including USD, EUR, GBP, JPY, and INR.', '', 'Free Currency Converter — Live Exchange Rates', 'Convert 150+ currencies instantly with real-time exchange rates. Free tool by FinanceFlow AI.', true, 0.7, 'daily', '{"@context":"https://schema.org","@type":"WebApplication","name":"FinanceFlow Currency Converter","description":"Real-time currency converter supporting 150+ global currencies","applicationCategory":"FinanceApplication"}'::jsonb),

('signin', 'Sign In', '/signin', 'Sign In to FinanceFlow AI — Your Financial Dashboard', 'Sign in to your FinanceFlow AI account to access your personal finance dashboard, budget tracker, investment portfolio, and AI financial advisor.', 'FinanceFlow login, sign in, financial dashboard, personal finance login', 'Sign In to FinanceFlow AI', 'Sign in to access your personal finance dashboard, budget tracker, and AI financial advisor.', '', 'Sign In to FinanceFlow AI', 'Sign in to your FinanceFlow AI financial dashboard.', false, 0.3, 'never', NULL),

('signup', 'Sign Up', '/signup', 'Create Your Free FinanceFlow AI Account — Start Managing Money Smarter', 'Sign up for FinanceFlow AI free. Get instant access to smart budgeting, expense tracking, AI financial advisor, and investment tools. No credit card required.', 'create account, free finance app, sign up FinanceFlow, budget app registration, personal finance account', 'Create Your Free FinanceFlow AI Account', 'Sign up free for FinanceFlow AI. Smart budgeting, AI financial advisor, and investment tools. No credit card required.', '', 'Sign Up Free — FinanceFlow AI', 'Create your free FinanceFlow AI account. No credit card required.', true, 0.8, 'monthly', NULL)

ON CONFLICT (page_key) DO NOTHING;
