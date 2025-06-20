-- Hotfix: Corregir función activate_template para RLS
-- El problema es que RLS requiere condiciones WHERE explícitas

-- Recrear función activate_template con condiciones WHERE explícitas
CREATE OR REPLACE FUNCTION activate_template(template_id UUID)
RETURNS boolean AS $$
BEGIN
  -- Desactivar todos los templates (con WHERE explícito para RLS)
  UPDATE story_style_templates 
  SET is_active = false 
  WHERE is_active = true;
  
  -- Activar el template especificado
  UPDATE story_style_templates 
  SET is_active = true 
  WHERE id = template_id;
  
  -- Verificar que se activó correctamente
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentario explicativo del fix
COMMENT ON FUNCTION activate_template(UUID) IS 'Activa un template específico y desactiva todos los demás. Fixed para RLS con WHERE explícito.';