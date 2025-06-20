-- Corregir políticas de story_style_configs para usar emails hardcodeados

-- Eliminar políticas existentes que usan rol metadata
DROP POLICY IF EXISTS "Admins can insert style configs" ON story_style_configs;
DROP POLICY IF EXISTS "Admins can view all style configs" ON story_style_configs;
DROP POLICY IF EXISTS "Admins can create style configs" ON story_style_configs;
DROP POLICY IF EXISTS "Admins can update style configs" ON story_style_configs;
DROP POLICY IF EXISTS "Admins can delete style configs" ON story_style_configs;

-- Mantener política de lectura pública para estilo activo
-- DROP POLICY IF EXISTS "Anyone can view active style config" ON story_style_configs;

-- Crear nuevas políticas usando emails hardcodeados
CREATE POLICY "Admins can view all style configs" ON story_style_configs
  FOR SELECT USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'fabarca212@gmail.com'::text, 
      'lucianoalonso2000@gmail.com'::text, 
      'javier2000asr@gmail.com'::text
    ])
  );

CREATE POLICY "Admins can insert style configs" ON story_style_configs
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'fabarca212@gmail.com'::text, 
      'lucianoalonso2000@gmail.com'::text, 
      'javier2000asr@gmail.com'::text
    ])
  );

CREATE POLICY "Admins can update style configs" ON story_style_configs
  FOR UPDATE USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'fabarca212@gmail.com'::text, 
      'lucianoalonso2000@gmail.com'::text, 
      'javier2000asr@gmail.com'::text
    ])
  ) WITH CHECK (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'fabarca212@gmail.com'::text, 
      'lucianoalonso2000@gmail.com'::text, 
      'javier2000asr@gmail.com'::text
    ])
  );

CREATE POLICY "Admins can delete style configs" ON story_style_configs
  FOR DELETE USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'fabarca212@gmail.com'::text, 
      'lucianoalonso2000@gmail.com'::text, 
      'javier2000asr@gmail.com'::text
    ])
  );