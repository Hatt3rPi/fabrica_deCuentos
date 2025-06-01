-- Script para corregir las políticas RLS de la tabla character_thumbnails
-- Este script debe ejecutarse en la consola SQL de Supabase

-- 1. Habilitar RLS si no está habilitado
ALTER TABLE public.character_thumbnails ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si existen
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'character_thumbnails') THEN
    DROP POLICY IF EXISTS "Users can view their character thumbnails" ON public.character_thumbnails;
    DROP POLICY IF EXISTS "Users can insert their character thumbnails" ON public.character_thumbnails;
    DROP POLICY IF EXISTS "Users can update their character thumbnails" ON public.character_thumbnails;
    DROP POLICY IF EXISTS "Users can delete their character thumbnails" ON public.character_thumbnails;
  END IF;
END $$;

-- 3. Crear políticas RLS
-- Política para permitir a los usuarios ver sus propias miniaturas
CREATE POLICY "Users can view their character thumbnails"
  ON public.character_thumbnails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_thumbnails.character_id 
      AND characters.user_id = auth.uid()
    )
  );

-- Política para permitir a los usuarios insertar sus propias miniaturas
CREATE POLICY "Users can insert their character thumbnails"
  ON public.character_thumbnails
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_thumbnails.character_id 
      AND characters.user_id = auth.uid()
    )
  );

-- Política para permitir a los usuarios actualizar sus propias miniaturas
CREATE POLICY "Users can update their character thumbnails"
  ON public.character_thumbnails
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_thumbnails.character_id 
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_thumbnails.character_id 
      AND characters.user_id = auth.uid()
    )
  );

-- Política para permitir a los usuarios eliminar sus propias miniaturas
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

-- 4. Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Agregar comentario para documentación
COMMENT ON TABLE public.character_thumbnails IS 'Almacena miniaturas de diferentes estilos para personajes con políticas RLS para aislamiento de usuarios';
