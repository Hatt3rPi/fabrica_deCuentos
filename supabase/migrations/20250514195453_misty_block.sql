/*
  # Update characters table with reference URLs

  1. Changes
    - Add reference_urls column if not exists
    - Add constraint to limit reference URLs to 3
    - Update character update policy

  2. Security
    - Update RLS policy for character updates
*/

-- Add reference_urls column to characters table if it doesn't exist
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
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reference_urls_length' 
    AND table_name = 'characters'
  ) THEN
    ALTER TABLE public.characters
    ADD CONSTRAINT reference_urls_length CHECK (array_length(reference_urls, 1) <= 3);
  END IF;
END $$;

-- Update character policies to include reference_urls
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;

CREATE POLICY "Users can update own characters"
ON public.characters
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());