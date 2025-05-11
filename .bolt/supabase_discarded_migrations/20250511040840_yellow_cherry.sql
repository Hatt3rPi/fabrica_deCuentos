/*
  # Update storage configuration for character images

  1. Changes
    - Create character-images bucket
    - Set up policies for public access to images
    - Configure upload restrictions for authenticated users
    - Allow users to delete their own images

  2. Security
    - Public read access for all images
    - Upload/delete restricted to authenticated users
    - File size limited to 5MB
    - Only allows .jpg, .jpeg, .png, and .webp files
    - Users can only manage their own files
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
  AND path LIKE 'characters/%'
  AND octet_length(content) <= 5242880 -- 5MB size limit
  AND (
    lower(right(path, 4)) IN ('.jpg', '.png') OR
    lower(right(path, 5)) IN ('.jpeg', '.webp')
  )
);

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'character-images' 
  AND owner = auth.uid()
  AND path LIKE 'characters/%'
);