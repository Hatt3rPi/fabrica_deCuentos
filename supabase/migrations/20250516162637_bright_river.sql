/*
  # Storage bucket and policies for reference images
  
  1. Creates a public bucket for reference images
  2. Sets up policies for authenticated users to manage their files
  3. Allows public read access to all files in the bucket
*/

-- Create the reference-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload files
CREATE POLICY "authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reference-images');

-- Policy for authenticated users to read files
CREATE POLICY "authenticated users can read files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'reference-images');

-- Policy for authenticated users to update files
CREATE POLICY "authenticated users can update files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'reference-images')
WITH CHECK (bucket_id = 'reference-images');

-- Policy for authenticated users to delete files
CREATE POLICY "authenticated users can delete files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reference-images');

-- Policy for public read access
CREATE POLICY "public can read files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'reference-images');