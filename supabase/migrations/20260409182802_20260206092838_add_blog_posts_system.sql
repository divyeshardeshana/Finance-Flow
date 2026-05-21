/*
  # Blog Posts Management System

  1. New Tables
    - `blog_categories` - Finance-related blog categories
    - `blog_posts` - Blog post content with SEO and publishing workflow

  2. Security
    - Enable RLS on both tables
    - Public read access for published blog posts and active categories
    - Admin-only write access for both tables

  3. Seed Data
    - Pre-populate blog_categories with finance-related categories
*/

CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#3B82F6',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active blog categories"
  ON blog_categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert blog categories"
  ON blog_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update blog categories"
  ON blog_categories
  FOR UPDATE
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

CREATE POLICY "Admins can delete blog categories"
  ON blog_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_id uuid NOT NULL REFERENCES blog_categories(id),
  target_keywords text NOT NULL DEFAULT '',
  tags text[] DEFAULT '{}',
  featured_image_url text DEFAULT '',
  meta_description text DEFAULT '',
  content text DEFAULT '',
  excerpt text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft', 'scheduled', 'published'])),
  auto_publish boolean NOT NULL DEFAULT false,
  scheduled_publish_at timestamptz,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can read all blog posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert blog posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update blog posts"
  ON blog_posts
  FOR UPDATE
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

CREATE POLICY "Admins can delete blog posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_scheduled
  ON blog_posts (status, scheduled_publish_at)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug
  ON blog_posts (slug);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at
  ON blog_posts (published_at DESC)
  WHERE status = 'published';

INSERT INTO blog_categories (name, slug, color) VALUES
  ('Personal Finance', 'personal-finance', '#3B82F6'),
  ('Budgeting Tips', 'budgeting-tips', '#10B981'),
  ('Investment Strategies', 'investment-strategies', '#F59E0B'),
  ('Saving Money', 'saving-money', '#06B6D4'),
  ('Tax Planning', 'tax-planning', '#EF4444'),
  ('Retirement Planning', 'retirement-planning', '#8B5CF6'),
  ('Debt Management', 'debt-management', '#EC4899'),
  ('Financial Literacy', 'financial-literacy', '#14B8A6'),
  ('Market Analysis', 'market-analysis', '#F97316')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_blog_view_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id AND status = 'published';
END;
$$;

CREATE OR REPLACE FUNCTION get_due_scheduled_posts()
RETURNS SETOF blog_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM blog_posts
  WHERE status = 'scheduled'
    AND scheduled_publish_at <= now();
END;
$$;
