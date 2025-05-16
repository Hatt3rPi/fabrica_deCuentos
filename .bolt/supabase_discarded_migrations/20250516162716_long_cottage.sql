/*
  # Storage configuration for reference images

  1. Creates a public bucket for reference images
  2. Sets up RLS policies for:
    - Authenticated users can upload/read/update/delete files
    - Public users can read files
*/

-- Create the reference-images bucket if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'reference-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('reference-images', 'reference-images', true);
  END IF;
END $$;

-- Create policies for storage.objects
DO $$ 
BEGIN
  -- Enable RLS
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'authenticated users can upload files'
  ) THEN
    CREATE POLICY "authenticated users can upload files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'reference-images');
  END IF;

  -- Read policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'authenticated users can read files'
  ) THEN
    CREATE POLICY "authenticated users can read files"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'reference-images');
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'authenticated users can update files'
  ) THEN
    CREATE POLICY "authenticated users can update files"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'reference-images')
    WITH CHECK (bucket_id = 'reference-images');
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'authenticated users can delete files'
  ) THEN
    CREATE POLICY "authenticated users can delete files"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'reference-images');
  END IF;

  -- Public read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'public can read files'
  ) THEN
    CREATE POLICY "public can read files"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'reference-images');
  END IF;
END $$;