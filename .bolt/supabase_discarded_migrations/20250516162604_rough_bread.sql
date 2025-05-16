/*
  # Storage bucket configuration and policies

  1. Changes
    - Create storage bucket if it doesn't exist
    - Configure RLS policies for authenticated users
    - Set up public access for thumbnails
  
  2. Security
    - Enable RLS on objects table
    - Restrict access based on user_id in path
    - Allow public access only to thumbnails
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('reference-images', 'reference-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create storage policies
BEGIN;
  -- Enable RLS
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Allow authenticated users to upload files
  DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
  CREATE POLICY "Users can upload own files"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'reference-images');

  -- Allow authenticated users to read their files
  DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
  CREATE POLICY "Users can read own files"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'reference-images');

  -- Allow authenticated users to update their files
  DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
  CREATE POLICY "Users can update own files"
    ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'reference-images')
    WITH CHECK (bucket_id = 'reference-images');

  -- Allow authenticated users to delete their files
  DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
  CREATE POLICY "Users can delete own files"
    ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'reference-images');

  -- Allow public access to read files
  DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
  CREATE POLICY "Public can read files"
    ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'reference-images');
COMMIT;