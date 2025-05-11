/*
  # Storage policies for character images
  
  1. Security
    - Allow public read access to character images
    - Allow authenticated users to upload images with size and type restrictions
    - Allow users to delete their own images
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
  AND name LIKE 'characters/%'
  AND octet_length(content) <= 5242880 -- 5MB size limit
  AND (
    lower(right(name, 4)) IN ('.jpg', '.png') OR
    lower(right(name, 5)) IN ('.jpeg', '.webp')
  )
);

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'character-images' 
  AND owner = auth.uid()
  AND name LIKE 'characters/%'
);