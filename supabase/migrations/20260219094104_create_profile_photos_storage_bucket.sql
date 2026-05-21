/*
  # Create profile-photos storage bucket

  ## Summary
  Creates the profile-photos storage bucket that is required for profile photo uploads.
  Without this bucket, users receive "Failed to upload photo" errors.

  ## Changes
  1. Creates the `profile-photos` bucket with public access enabled
  2. Adds RLS storage policy allowing authenticated users to upload to their own folder
  3. Adds RLS storage policy allowing public read access to all avatars

  ## Security
  - Upload is restricted to authenticated users only
  - Users can only write to paths starting with their own user ID
  - Read access is public so uploaded photos can be displayed via URL
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND name LIKE 'avatars/' || auth.uid()::text || '%'
  );

CREATE POLICY "Public can read profile photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND name LIKE 'avatars/' || auth.uid()::text || '%'
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND name LIKE 'avatars/' || auth.uid()::text || '%'
  );

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND name LIKE 'avatars/' || auth.uid()::text || '%'
  );
