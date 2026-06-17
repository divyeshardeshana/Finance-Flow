-- Public storage bucket for AI-generated blog hero images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow service role (edge functions) to insert
CREATE POLICY "service role can upload blog images"
  ON storage.objects FOR INSERT
  TO service_role
  USING (bucket_id = 'blog-images');

-- Public read
CREATE POLICY "public can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');
