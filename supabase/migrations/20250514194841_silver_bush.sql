/*
  # Update characters table schema

  1. Changes
    - Add reference_urls column if it doesn't exist
    - Add length constraint for reference_urls if it doesn't exist
    - Update character policies

  2. Notes
    - Uses IF NOT EXISTS checks to avoid duplicate constraint errors
    - Safely drops and recreates policies
*/

-- Add reference_urls column to characters table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'reference_urls'
  ) THEN
    ALTER TABLE public.characters
    ADD COLUMN reference_urls text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Add constraint to limit number of reference URLs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'reference_urls_length'
  ) THEN
    ALTER TABLE public.characters
    ADD CONSTRAINT reference_urls_length CHECK (array_length(reference_urls, 1) <= 3);
  END IF;
END $$;

-- Update character policies
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;

CREATE POLICY "Users can update own characters"
ON public.characters
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());