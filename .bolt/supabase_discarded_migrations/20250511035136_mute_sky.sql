/*
  # Storage configuration for character images
  
  1. New Storage
    - Creates a public bucket for character images
    - Sets up policies for access control
    
  2. Security
    - Public read access to images
    - Authenticated users can upload and delete their own images
    - 5MB file size limit for uploads
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
  AND LENGTH(COALESCE(file, '')) <= 5242880 -- 5MB size limit
);

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'character-images' AND owner = auth.uid());