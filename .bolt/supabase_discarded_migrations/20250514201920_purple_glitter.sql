/*
  # Add storage policies for reference images

  1. Storage
    - Create 'reference-images' bucket if it doesn't exist
    - Add policies for authenticated users to manage their character images
  
  2. Security
    - Enable storage policies for reference-images bucket
    - Add policies for:
      - Uploading images (authenticated users only)
      - Reading images (authenticated users can read their own)
      - Updating images (authenticated users can update their own)
      - Deleting images (authenticated users can delete their own)
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('reference-images', 'reference-images', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for uploading images
CREATE POLICY "Users can upload reference images for their characters" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE id::text = (regexp_match(name, '^[^/]+'))[1]
    AND user_id = auth.uid()
  )
);

-- Policy for reading images
CREATE POLICY "Users can read their own reference images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE id::text = (regexp_match(name, '^[^/]+'))[1]
    AND user_id = auth.uid()
  )
);

-- Policy for updating images
CREATE POLICY "Users can update their own reference images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE id::text = (regexp_match(name, '^[^/]+'))[1]
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE id::text = (regexp_match(name, '^[^/]+'))[1]
    AND user_id = auth.uid()
  )
);

-- Policy for deleting images
CREATE POLICY "Users can delete their own reference images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE id::text = (regexp_match(name, '^[^/]+'))[1]
    AND user_id = auth.uid()
  )
);