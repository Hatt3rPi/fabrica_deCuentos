-- Enable RLS on character_thumbnails
ALTER TABLE public.character_thumbnails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'character_thumbnails') THEN
    DROP POLICY IF EXISTS "Users can view their character thumbnails" ON public.character_thumbnails;
    DROP POLICY IF EXISTS "Users can insert their character thumbnails" ON public.character_thumbnails;
    DROP POLICY IF EXISTS "Users can update their character thumbnails" ON public.character_thumbnails;
    DROP POLICY IF EXISTS "Users can delete their character thumbnails" ON public.character_thumbnails;
  END IF;
END $$;

-- Create policies
CREATE POLICY "Users can view their character thumbnails"
  ON public.character_thumbnails
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_thumbnails.character_id 
    AND characters.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their character thumbnails"
  ON public.character_thumbnails
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.characters 
    WHERE id = character_thumbnails.character_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their character thumbnails"
  ON public.character_thumbnails
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.characters 
    WHERE id = character_thumbnails.character_id 
    AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.characters 
    WHERE id = character_thumbnails.character_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their character thumbnails"
  ON public.character_thumbnails
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.characters 
    WHERE id = character_thumbnails.character_id 
    AND user_id = auth.uid()
  ));

-- Add comment for documentation
COMMENT ON TABLE public.character_thumbnails IS 'Stores different style thumbnails for characters with RLS policies for user isolation';
