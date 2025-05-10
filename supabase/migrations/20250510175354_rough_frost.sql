/*
  # Create character images storage bucket

  1. Storage
    - Creates 'character-images' bucket for storing character images
  
  2. Security
    - Enable public access for reading images
    - Allow authenticated users to upload images
    - Set size limit to 5MB
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-images', 'character-images', true);

-- Policy to allow public access to images
CREATE POLICY "Give public access to character images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'character-images');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload character images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'character-images' 
  AND owner = auth.uid()
  AND octet_length(content) <= 5242880 -- 5MB size limit
);

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'character-images' AND owner = auth.uid());