/*
  # Create storage bucket and RLS policies for reference images

  1. Storage
    - Create `reference-images` bucket for character reference images
  
  2. Security
    - Enable RLS on the bucket
    - Add policies for authenticated users to:
      - Upload their own images
      - Read their own images
      - Delete their own images
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('reference-images', 'reference-images', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the reference-images bucket
DO $$
BEGIN
  -- Policy for inserting objects (uploading)
  CREATE POLICY "Users can upload reference images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reference-images' AND
    auth.uid()::text = owner
  );

  -- Policy for selecting objects (downloading/viewing)
  CREATE POLICY "Users can view own reference images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reference-images' AND
    auth.uid()::text = owner
  );

  -- Policy for deleting objects
  CREATE POLICY "Users can delete own reference images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reference-images' AND
    auth.uid()::text = owner
  );

EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;