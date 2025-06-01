-- Asegurar RLS para la tabla story_characters

-- 1. Habilitar RLS si no está habilitado
ALTER TABLE public.story_characters ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si existen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_characters') THEN
    DROP POLICY IF EXISTS "Users can view their story characters" ON public.story_characters;
    DROP POLICY IF EXISTS "Users can insert their story characters" ON public.story_characters;
    DROP POLICY IF EXISTS "Users can delete their story characters" ON public.story_characters;
  END IF;
END $$;

-- 3. Crear políticas RLS
-- Política para ver personajes de historias
CREATE POLICY "Users can view their story characters"
  ON public.story_characters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_characters.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Política para insertar personajes en historias
CREATE POLICY "Users can insert their story characters"
  ON public.story_characters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_characters.story_id 
      AND stories.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = story_characters.character_id 
      AND characters.user_id = auth.uid()
    )
  );

-- Política para eliminar personajes de historias
CREATE POLICY "Users can delete their story characters"
  ON public.story_characters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_characters.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
