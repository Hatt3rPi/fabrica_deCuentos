/*
  # Add character image storage and reference URLs

  1. Changes
    - Add reference_urls column to characters table
    - Update character update policy

  2. Notes
    - Storage bucket and policies must be created via the Supabase dashboard
    - The bucket 'characters' should be created manually with public read access
    - RLS policies for storage should be configured through the dashboard
*/

-- Add reference_urls column to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS reference_urls text[] DEFAULT ARRAY[]::text[];

-- Add constraint to limit number of reference URLs
ALTER TABLE public.characters
ADD CONSTRAINT reference_urls_length CHECK (array_length(reference_urls, 1) <= 3);

-- Update character policies to include reference_urls
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;

CREATE POLICY "Users can update own characters"
ON public.characters
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());