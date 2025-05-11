/*
  # Update storage policies for character images

  1. Security
    - Add policy for public read access to character images
    - Add policy for authenticated users to upload images with size and type restrictions
    - Add policy for users to delete their own images
    - Restrict uploads to characters/ path prefix
    - Limit file size to 5MB
    - Allow only .jpg, .jpeg, .png, and .webp files
*/

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