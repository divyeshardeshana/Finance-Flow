/*
  # Create Homepage Content Management System

  1. New Tables
    - `homepage_content`
      - `id` (uuid, primary key)
      - `content_type` (text) - Type of content (pricing_heading, pricing_subheading, etc.)
      - `content_data` (jsonb) - Flexible JSON storage for content
      - `is_published` (boolean) - Whether content is live
      - `version` (integer) - Content version number
      - `updated_by` (uuid) - Admin who made the update
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `homepage_content` table
    - Add policy for admins to manage content
    - Add policy for all users to read published content
*/

CREATE TABLE IF NOT EXISTS homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('pricing_section', 'hero_section', 'features_section')),
  content_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean DEFAULT false,
  version integer DEFAULT 1,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all homepage content
CREATE POLICY "Admins can manage homepage content"
  ON homepage_content
  FOR ALL
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

-- Policy for all authenticated users to read published content
CREATE POLICY "Users can view published content"
  ON homepage_content
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Insert default pricing section content
INSERT INTO homepage_content (content_type, content_data, is_published, version)
VALUES (
  'pricing_section',
  '{
    "heading": "Choose the plan that''s right for you",
    "subheading": "Start free and upgrade as you grow",
    "tiers": {
      "free": {
        "badge": "",
        "description": "Perfect for getting started",
        "cta_text": "Get Started"
      },
      "paid": {
        "badge": "Most Popular",
        "description": "For serious financial planning",
        "cta_text": "Get Started"
      },
      "premium": {
        "badge": "",
        "description": "Complete financial management",
        "cta_text": "Get Started"
      }
    }
  }'::jsonb,
  true,
  1
) ON CONFLICT DO NOTHING;