-- Primero, deshabilitar RLS temporalmente para poder modificar las políticas
ALTER TABLE public.story_characters DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_characters') THEN
    DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.story_characters;
    DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.story_characters;
    DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.story_characters;
    -- Eliminar también las políticas que creamos anteriormente por si acaso
    DROP POLICY IF EXISTS "Users can view their story characters" ON public.story_characters;
    DROP POLICY IF EXISTS "Users can insert their story characters" ON public.story_characters;
    DROP POLICY IF EXISTS "Users can delete their story characters" ON public.story_characters;
  END IF;
END $$;

-- Crear políticas RLS simplificadas pero seguras
CREATE POLICY "Enable read access for authenticated users"
  ON public.story_characters
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.story_characters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable delete for users based on user_id"
  ON public.story_characters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_characters.story_id
      AND s.user_id = auth.uid()
    )
  );

-- Volver a habilitar RLS
ALTER TABLE public.story_characters ENABLE ROW LEVEL SECURITY;

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
