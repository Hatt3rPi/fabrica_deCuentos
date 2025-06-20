-- Crear función RPC para activar estilo sin conflictos de triggers
CREATE OR REPLACE FUNCTION activate_style_config(style_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Desactivar todos los estilos en una sola operación
  UPDATE story_style_configs 
  SET is_active = CASE 
    WHEN id = style_id THEN true 
    ELSE false 
  END;
  
  -- Verificar que la operación fue exitosa
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Style with ID % not found', style_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;