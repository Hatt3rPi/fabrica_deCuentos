-- Consolidar story_style_configs en templates y preparar para deprecación

-- 1. Crear backup por seguridad
CREATE TABLE IF NOT EXISTS story_style_configs_backup AS 
SELECT * FROM story_style_configs;

-- 2. Migrar configuraciones existentes que no están en templates
INSERT INTO story_style_templates (name, category, config_data, is_active, is_premium, created_at)
SELECT 
  CASE 
    WHEN name IS NOT NULL AND name != '' THEN name
    ELSE 'Configuración Migrada ' || EXTRACT(EPOCH FROM created_at)::text
  END,
  'classic'::text as category,
  jsonb_build_object(
    'cover_config', cover_config,
    'page_config', page_config
  ) as config_data,
  COALESCE(is_active, false) as is_active,
  false as is_premium,
  COALESCE(created_at, now()) as created_at
FROM story_style_configs 
WHERE NOT EXISTS (
  SELECT 1 FROM story_style_templates 
  WHERE story_style_templates.name = story_style_configs.name
)
ON CONFLICT DO NOTHING;

-- 3. Verificar que hay al menos un template activo
DO $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count 
    FROM story_style_templates 
    WHERE is_active = true;
    
    -- Si no hay ninguno activo, activar el primero
    IF active_count = 0 THEN
        UPDATE story_style_templates 
        SET is_active = true 
        WHERE id = (
            SELECT id FROM story_style_templates 
            ORDER BY created_at 
            LIMIT 1
        );
        RAISE NOTICE 'Activated first template as default';
    END IF;
END $$;

-- 4. Actualizar get_active_story_style para usar solo templates
CREATE OR REPLACE FUNCTION get_active_story_style()
RETURNS jsonb AS $$
DECLARE
  active_template jsonb;
BEGIN
  -- Solo buscar en templates activos
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'cover_config', config_data->'cover_config',
    'page_config', config_data->'page_config',
    'cover_background_url', null,
    'page_background_url', null,
    'cover_sample_text', null,
    'page_sample_text', null
  ) INTO active_template
  FROM story_style_templates
  WHERE is_active = true 
  LIMIT 1;
  
  -- Si no hay template activo, retornar configuración por defecto
  IF active_template IS NULL THEN
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
      }'::jsonb,
      'cover_background_url', null,
      'page_background_url', null,
      'cover_sample_text', null,
      'page_sample_text', null
    );
  END IF;
  
  RETURN active_template;
END;
$$ LANGUAGE plpgsql;

-- 5. Marcar tabla como deprecated
COMMENT ON TABLE story_style_configs IS 'DEPRECATED: Migrated to story_style_templates. Use story_style_templates for new functionality. This table is kept for backup purposes only.';

-- 6. Crear función para verificar migración
CREATE OR REPLACE FUNCTION verify_style_migration()
RETURNS TABLE(
    configs_count INTEGER,
    templates_count INTEGER,
    active_template_exists BOOLEAN,
    migration_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM story_style_configs),
        (SELECT COUNT(*)::INTEGER FROM story_style_templates),
        (SELECT COUNT(*) > 0 FROM story_style_templates WHERE is_active = true),
        CASE 
            WHEN (SELECT COUNT(*) FROM story_style_templates WHERE is_active = true) > 0 THEN 'SUCCESS'
            ELSE 'NEEDS_ATTENTION'
        END;
END;
$$ LANGUAGE plpgsql;

-- 7. Ejecutar verificación
SELECT * FROM verify_style_migration();