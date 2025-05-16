/*
  # Update Storage Structure and Policies

  1. Changes
    - Create storage bucket if not exists
    - Enable RLS on storage bucket
    - Add storage policies for authenticated users

  2. Security
    - Enable RLS on storage bucket
    - Add policies for authenticated users to:
      - Upload files
      - Download files
      - Delete files
*/

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name)
VALUES ('storage', 'storage')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'storage');

CREATE POLICY "Authenticated users can update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'storage' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'storage' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can download files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'storage');