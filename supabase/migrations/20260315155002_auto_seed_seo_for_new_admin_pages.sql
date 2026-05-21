/*
  # Auto-seed SEO entries for new admin nav pages

  ## Summary
  Adds SEO page entries for the two new admin pages being added to the navigation:
  - Blog Management (/admin/blog)
  - Email Management (/admin/email)

  These pages are noindex since they are admin-only internal pages.

  ## Changes
  - Inserts seo_pages rows for 'admin_blog' and 'admin_email' page keys
  - Both are marked non-indexable (admin-only, should not appear in search results)
  - Low priority and 'never' change frequency for sitemap

  ## Notes
  - Uses ON CONFLICT DO NOTHING so re-running is safe
  - Admins can still view and optionally edit these entries in SEO Management
*/

INSERT INTO seo_pages (page_key, page_name, page_path, meta_title, meta_description, meta_keywords, is_indexable, priority, change_frequency) VALUES
(
  'admin_blog',
  'Admin — Blog Management',
  '/admin/blog',
  'Blog Management — FinanceFlow AI Admin',
  'Manage AI-generated blog posts for the FinanceFlow AI public website.',
  'admin, blog management, content management',
  false,
  0.1,
  'never'
),
(
  'admin_email',
  'Admin — Email Management',
  '/admin/email',
  'Email Management — FinanceFlow AI Admin',
  'Configure SMTP settings, email templates, and notification alerts for FinanceFlow AI.',
  'admin, email management, smtp, email templates',
  false,
  0.1,
  'never'
)
ON CONFLICT (page_key) DO NOTHING;
