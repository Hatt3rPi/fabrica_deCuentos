/*
  # Create storage bucket and policies for reference images

  1. Changes
    - Create private storage bucket for reference images
    - Add policies for authenticated users to:
      - Upload their own images
      - View their own images
      - Delete their own images

  2. Security
    - Bucket is private (not public)
    - RLS policies ensure users can only access their own files
*/

-- Create the storage bucket using the storage extension
SELECT storage.create_bucket('reference-images', JSONB_BUILD_OBJECT(
  'public', false,
  'allowed_mime_types', ARRAY['image/jpeg', 'image/png', 'image/webp'],
  'file_size_limit', 5242880 -- 5MB in bytes
));

-- Create policy for uploading images
SELECT storage.create_policy(
  'reference-images',
  'upload',
  'authenticated',
  'auth.uid()::text = owner'
);

-- Create policy for downloading/viewing images
SELECT storage.create_policy(
  'reference-images',
  'read',
  'authenticated',
  'auth.uid()::text = owner'
);

-- Create policy for deleting images
SELECT storage.create_policy(
  'reference-images',
  'remove',
  'authenticated',
  'auth.uid()::text = owner'
);