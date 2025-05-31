-- Fix typo in character_thumbnails RLS policy

-- Drop the incorrect policy if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies 
             WHERE tablename = 'character_thumbnails' 
             AND policyname = 'Users can delete their character thumbnails') THEN
    DROP POLICY "Users can delete their character thumbnails" ON public.character_thumbnails;
  END IF;
END $$;

-- Recreate the policy with the correct table name
CREATE POLICY "Users can delete their character thumbnails"
  ON public.character_thumbnails
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_thumbnails.character_id 
      AND characters.user_id = auth.uid()
    )
  );

-- Add comment to document the fix
COMMENT ON POLICY "Users can delete their character thumbnails" ON public.character_thumbnails 
IS 'Allows users to delete their own character thumbnails. Fixed typo in table name reference on 2025-05-30';
