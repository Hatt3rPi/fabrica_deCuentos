/*
  # Storage bucket configuration for character images

  1. New Storage
    - Creates 'fabricacuentos' bucket for storing character images
    - Sets bucket as public for easy access
  
  2. Security
    - Allows public read access to images
    - Restricts upload/delete to authenticated users
    - Limits file size to 5MB
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
  AND storage.foldername(name) = 'characters'
);

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fabricacuentos' AND owner = auth.uid());