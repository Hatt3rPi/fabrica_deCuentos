/*
  # Storage policies for character images

  1. Security
    - Enable public access to character images
    - Allow authenticated users to upload images
    - Allow users to delete their own images
    - Enforce 5MB size limit
    - Restrict to image files only

  2. Changes
    - Add policies for SELECT, INSERT and DELETE operations
    - Set size and file type restrictions
*/

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
  bucket_id = 'fabricacuentos' 
  AND owner = auth.uid()
  AND path LIKE 'characters/%'
);