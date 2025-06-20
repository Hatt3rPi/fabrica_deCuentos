-- Migrar de story_style_configs a story_style_templates con soporte para templates activos

-- 1. Agregar columna is_active a story_style_templates
ALTER TABLE story_style_templates 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;

-- 2. Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_story_style_templates_active ON story_style_templates(is_active);

-- 3. Función para asegurar solo un template activo
CREATE OR REPLACE FUNCTION ensure_single_active_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE story_style_templates 
    SET is_active = false 
    WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para mantener un solo template activo
DROP TRIGGER IF EXISTS ensure_single_active_template_trigger ON story_style_templates;
CREATE TRIGGER ensure_single_active_template_trigger
BEFORE INSERT OR UPDATE ON story_style_templates
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION ensure_single_active_template();

-- 5. Migrar configuración activa actual a un template activo
DO $$
DECLARE
    active_config_record RECORD;
    template_id UUID;
BEGIN
    -- Obtener la configuración activa actual
    SELECT id, name, cover_config, page_config 
    INTO active_config_record
    FROM story_style_configs 
    WHERE is_active = true 
    LIMIT 1;
    
    IF active_config_record IS NOT NULL THEN
        -- Crear un template basado en la configuración activa
        INSERT INTO story_style_templates (
            name, 
            category, 
            config_data, 
            is_active, 
            is_premium
        ) VALUES (
            COALESCE(active_config_record.name, 'Configuración Migrada'),
            'classic',
            jsonb_build_object(
                'cover_config', active_config_record.cover_config,
                'page_config', active_config_record.page_config
            ),
            true,
            false
        ) RETURNING id INTO template_id;
        
        RAISE NOTICE 'Migrated active config to template with ID: %', template_id;
    ELSE
        -- Si no hay configuración activa, activar el primer template disponible
        UPDATE story_style_templates 
        SET is_active = true 
        WHERE id = (SELECT id FROM story_style_templates ORDER BY created_at LIMIT 1);
        
        RAISE NOTICE 'No active config found, activated first template';
    END IF;
END $$;

-- 6. Actualizar función get_active_story_style para usar templates
CREATE OR REPLACE FUNCTION get_active_story_style()
RETURNS jsonb AS $$
DECLARE
  active_template jsonb;
BEGIN
  -- Buscar en templates activos
  SELECT 
    jsonb_build_object(
      'id', id,
      'name', name,
      'cover_config', config_data->'cover_config',
      'page_config', config_data->'page_config'
    ) INTO active_template
  FROM story_style_templates
  WHERE is_active = true
  LIMIT 1;
  
  IF active_template IS NOT NULL THEN
    RETURN active_template;
  END IF;
  
  -- Fallback: buscar primer template disponible
  SELECT 
    jsonb_build_object(
      'id', id,
      'name', name,
      'cover_config', config_data->'cover_config',
      'page_config', config_data->'page_config'
    ) INTO active_template
  FROM story_style_templates
  ORDER BY created_at
  LIMIT 1;
  
  IF active_template IS NOT NULL THEN
    -- Activar este template como fallback
    UPDATE story_style_templates 
    SET is_active = true 
    WHERE id = (active_template->>'id')::uuid;
    
    RETURN active_template;
  END IF;
  
  -- Fallback final: configuración por defecto hardcodeada
  RETURN jsonb_build_object(
    'id', null,
    'name', 'Configuración por Defecto',
    'cover_config', '{
      "title": {
        "fontSize": "4rem",
        "fontFamily": "Indie Flower",
        "fontWeight": "bold",
        "color": "#ffffff",
        "textAlign": "center",
        "textShadow": "3px 3px 6px rgba(0,0,0,0.8)",
        "position": "center",
        "containerStyle": {
          "background": "transparent",
          "padding": "2rem 3rem",
          "borderRadius": "0",
          "maxWidth": "85%"
        }
      }
    }'::jsonb,
    'page_config', '{
      "text": {
        "fontSize": "2.2rem",
        "fontFamily": "Indie Flower",
        "fontWeight": "600",
        "lineHeight": "1.4",
        "color": "#ffffff",
        "textAlign": "center",
        "textShadow": "3px 3px 6px rgba(0,0,0,0.9)",
        "position": "bottom",
        "verticalAlign": "flex-end",
        "containerStyle": {
          "background": "transparent",
          "padding": "1rem 2rem 6rem 2rem",
          "minHeight": "25%"
        }
      }
    }'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Función para activar un template específico
CREATE OR REPLACE FUNCTION activate_template(template_id UUID)
RETURNS boolean AS $$
BEGIN
  -- Desactivar todos los templates
  UPDATE story_style_templates SET is_active = false;
  
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

-- 8. Comentario explicativo
COMMENT ON COLUMN story_style_templates.is_active IS 'Indica el template actualmente usado por PDF y vista de cuentos';
COMMENT ON FUNCTION get_active_story_style() IS 'Retorna el template activo para uso en PDF y vista';
COMMENT ON FUNCTION activate_template(UUID) IS 'Activa un template específico y desactiva todos los demás';