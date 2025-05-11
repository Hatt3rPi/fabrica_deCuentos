/*
  # Storage bucket configuration for character images

  1. New Storage
    - Creates 'fabricacuentos' bucket
    - Sets bucket as public
  
  2. Security
    - Allows public read access to all files
    - Allows authenticated users to upload to characters folder
    - Allows users to delete their own files
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('fabricacuentos', 'fabricacuentos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to images
CREATE POLICY "Give public access to character images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fabricacuentos');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload character images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fabricacuentos' 
  AND owner = auth.uid()
  AND position('characters/' in name) = 1
);

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fabricacuentos' AND owner = auth.uid());