/*
  # Create reference-images bucket
  
  Creates a public bucket for storing character reference images.
  The bucket will be accessible by authenticated users for CRUD operations
  and by the public for read operations.
  
  Note: RLS policies are managed through the Supabase dashboard
  since we don't have direct access to modify storage.objects.
*/

-- Create the reference-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true)
ON CONFLICT (id) DO NOTHING;