-- Eliminar políticas existentes de templates que usan rol metadata
DROP POLICY IF EXISTS "Admins can manage style templates" ON story_style_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON story_style_templates;

-- Crear nuevas políticas usando emails hardcodeados como administradores
CREATE POLICY "Admins can insert style templates" ON story_style_templates
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'fabarca212@gmail.com'::text, 
      'lucianoalonso2000@gmail.com'::text, 
      'javier2000asr@gmail.com'::text
    ])
  );

CREATE POLICY "Admins can update style templates" ON story_style_templates
  FOR UPDATE USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'fabarca212@gmail.com'::text, 
      'lucianoalonso2000@gmail.com'::text, 
      'javier2000asr@gmail.com'::text
    ])
  );

CREATE POLICY "Admins can delete style templates" ON story_style_templates
  FOR DELETE USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'fabarca212@gmail.com'::text, 
      'lucianoalonso2000@gmail.com'::text, 
      'javier2000asr@gmail.com'::text
    ])
  );