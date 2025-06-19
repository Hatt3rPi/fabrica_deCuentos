-- Corregir políticas RLS para story_style_configs
-- Las políticas actuales podrían estar demasiado restrictivas

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Admins can view style configs" ON story_style_configs;
DROP POLICY IF EXISTS "Admins can create style configs" ON story_style_configs;
DROP POLICY IF EXISTS "Admins can update style configs" ON story_style_configs;
DROP POLICY IF EXISTS "Admins can delete style configs" ON story_style_configs;

-- Crear políticas más permisivas para administradores
-- Ver configuraciones (todos pueden ver la activa, admins pueden ver todas)
CREATE POLICY "Anyone can view active style config" ON story_style_configs
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all style configs" ON story_style_configs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Crear configuraciones (solo admins)
CREATE POLICY "Admins can create style configs" ON story_style_configs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Actualizar configuraciones (solo admins)
CREATE POLICY "Admins can update style configs" ON story_style_configs
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Eliminar configuraciones (solo admins)
CREATE POLICY "Admins can delete style configs" ON story_style_configs
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Asegurar que RLS esté habilitado
ALTER TABLE story_style_configs ENABLE ROW LEVEL SECURITY;

-- También necesitamos políticas para story_style_templates si no existen
ALTER TABLE story_style_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para templates
DROP POLICY IF EXISTS "Anyone can view templates" ON story_style_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON story_style_templates;

CREATE POLICY "Anyone can view templates" ON story_style_templates
FOR SELECT USING (true);

CREATE POLICY "Admins can manage templates" ON story_style_templates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);