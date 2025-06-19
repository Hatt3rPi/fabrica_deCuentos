-- Fix storage policies using correct Supabase pattern
-- This replaces the problematic migrations that tried to use storage.policies table

-- First ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'storage', 
  'storage', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) 
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing storage policies if they exist
DO $$
BEGIN
  -- Drop policies on storage.objects if they exist
  DROP POLICY IF EXISTS "authenticated_upload_style_design" ON storage.objects;
  DROP POLICY IF EXISTS "authenticated_update_style_design" ON storage.objects;
  DROP POLICY IF EXISTS "public_read_style_design" ON storage.objects;
  DROP POLICY IF EXISTS "authenticated_delete_style_design" ON storage.objects;
  
  -- Also drop any policies that might have been created with other names
  DROP POLICY IF EXISTS "Admins can upload to style_design folder" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update style_design files" ON storage.objects;
  DROP POLICY IF EXISTS "Public can read style_design files" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete style_design files" ON storage.objects;
END $$;

-- Create storage policies using standard CREATE POLICY syntax
CREATE POLICY "authenticated_upload_style_design"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'storage' AND 
    (storage.foldername(name))[1] = 'style_design'
  );

CREATE POLICY "authenticated_update_style_design"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'storage' AND 
    (storage.foldername(name))[1] = 'style_design'
  )
  WITH CHECK (
    bucket_id = 'storage' AND 
    (storage.foldername(name))[1] = 'style_design'
  );

CREATE POLICY "public_read_style_design"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'storage' AND 
    (storage.foldername(name))[1] = 'style_design'
  );

CREATE POLICY "authenticated_delete_style_design"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'storage' AND 
    (storage.foldername(name))[1] = 'style_design'
  );

-- Storage policies configured successfully