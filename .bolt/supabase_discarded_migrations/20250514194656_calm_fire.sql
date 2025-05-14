/*
# Add character storage bucket and policies

1. Storage
  - Create new storage bucket for character images
  - Enable RLS on the bucket
  - Add policies for authenticated users to manage their own images

2. Changes
  - Add reference_urls column to characters table
  - Update character policies
*/

-- Create storage bucket for character images
INSERT INTO storage.buckets (id, name)
VALUES ('characters', 'characters')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for character images
CREATE POLICY "Users can upload character images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'characters' AND
  (storage.foldername(name))[1] = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM characters
    WHERE id = (storage.foldername(name))[2]
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their character images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'characters' AND
  (storage.foldername(name))[1] = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM characters
    WHERE id = (storage.foldername(name))[2]
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their character images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'characters' AND
  (storage.foldername(name))[1] = 'reference-images' AND
  EXISTS (
    SELECT 1 FROM characters
    WHERE id = (storage.foldername(name))[2]
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can read character images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'characters');

-- Add reference_urls column to characters table
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS reference_urls text[] DEFAULT ARRAY[]::text[];

-- Update character policies to include reference_urls
DROP POLICY IF EXISTS "Users can update own characters" ON characters;
CREATE POLICY "Users can update own characters"
ON characters
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());