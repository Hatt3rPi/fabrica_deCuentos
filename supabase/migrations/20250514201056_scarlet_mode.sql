/*
  # Add storage policies for reference images

  1. Storage Bucket
    - Create `reference-images` bucket if it doesn't exist
  
  2. Security
    - Enable storage policies for authenticated users to:
      - Upload images to their own character folders
      - Read images from their own character folders
      - Delete images from their own character folders
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'reference-images'
  ) THEN
    INSERT INTO storage.buckets (id, name)
    VALUES ('reference-images', 'reference-images');
  END IF;
END $$;

-- Policy to allow authenticated users to upload images to their own character folders
CREATE POLICY "Users can upload reference images for their characters"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE 
      characters.user_id = auth.uid() AND
      (storage.foldername(name))[1] = characters.id::text
  )
);

-- Policy to allow authenticated users to read their own character images
CREATE POLICY "Users can read their own character reference images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE 
      characters.user_id = auth.uid() AND
      (storage.foldername(name))[1] = characters.id::text
  )
);

-- Policy to allow authenticated users to delete their own character images
CREATE POLICY "Users can delete their own character reference images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE 
      characters.user_id = auth.uid() AND
      (storage.foldername(name))[1] = characters.id::text
  )
);