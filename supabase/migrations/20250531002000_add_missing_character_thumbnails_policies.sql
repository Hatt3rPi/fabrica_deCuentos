-- Asegurar que todas las políticas RLS necesarias para character_thumbnails estén presentes

-- 1. Política para SELECT (lectura)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
                WHERE tablename = 'character_thumbnails'
                AND policyname = 'Users can view their character thumbnails') THEN
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
  END IF;
END $$;

-- 2. Política para INSERT (inserción)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
                WHERE tablename = 'character_thumbnails'
                AND policyname = 'Users can insert their character thumbnails') THEN
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
  END IF;
END $$;

-- 3. Política para UPDATE (actualización)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
                WHERE tablename = 'character_thumbnails'
                AND policyname = 'Users can update their character thumbnails') THEN
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
  END IF;
END $$;

-- 4. Verificar que todas las políticas estén presentes
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'character_thumbnails';
  
  IF policy_count < 4 THEN
    RAISE NOTICE 'Se esperaban 4 políticas para character_thumbnails, pero solo se encontraron %', policy_count;
  END IF;
END $$;
