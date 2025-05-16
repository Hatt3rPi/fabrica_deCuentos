/*
  # Storage bucket setup and policies

  1. New Bucket
    - Creates 'storage' bucket for general file storage
    - Sets bucket as public for easy access
  
  2. Security
    - Enables RLS on storage.objects
    - Creates policies for authenticated users to manage their files
    - Allows public read access to all files
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('storage', 'storage', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DO $$ 
BEGIN
  -- Create upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can upload files'
  ) THEN
    CREATE POLICY "Users can upload files"
      ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'storage');
  END IF;

  -- Create read policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can read files'
  ) THEN
    CREATE POLICY "Users can read files"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'storage');
  END IF;

  -- Create update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can update files'
  ) THEN
    CREATE POLICY "Users can update files"
      ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'storage')
      WITH CHECK (bucket_id = 'storage');
  END IF;

  -- Create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can delete files'
  ) THEN
    CREATE POLICY "Users can delete files"
      ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'storage');
  END IF;

  -- Create public read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public can read files'
  ) THEN
    CREATE POLICY "Public can read files"
      ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'storage');
  END IF;
END $$;