/*
  # Storage configuration for reference images

  1. Creates a storage bucket for reference images with:
    - 5MB file size limit
    - Restricted to image formats (JPEG, PNG, WebP)
    - Private access (not public)
  
  2. Sets up RLS policies for:
    - Uploading images (authenticated users only)
    - Viewing own images
    - Deleting own images
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-images',
  'reference-images',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create policies for the reference-images bucket
DO $$
BEGIN
  -- Policy for uploading images
  DROP POLICY IF EXISTS "Users can upload reference images" ON storage.objects;
  CREATE POLICY "Users can upload reference images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'reference-images'
      AND owner = (auth.uid())::text
    );

  -- Policy for viewing images
  DROP POLICY IF EXISTS "Users can view own reference images" ON storage.objects;
  CREATE POLICY "Users can view own reference images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'reference-images'
      AND owner = (auth.uid())::text
    );

  -- Policy for deleting images
  DROP POLICY IF EXISTS "Users can delete own reference images" ON storage.objects;
  CREATE POLICY "Users can delete own reference images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'reference-images'
      AND owner = (auth.uid())::text
    );
END $$;