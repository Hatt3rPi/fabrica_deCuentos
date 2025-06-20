-- Agregar columnas para textos de muestra personalizados
ALTER TABLE story_style_configs
ADD COLUMN IF NOT EXISTS cover_sample_text TEXT,
ADD COLUMN IF NOT EXISTS page_sample_text TEXT;

-- Actualizar comentarios
COMMENT ON COLUMN story_style_configs.cover_sample_text IS 'Texto de muestra personalizado para la portada';
COMMENT ON COLUMN story_style_configs.page_sample_text IS 'Texto de muestra personalizado para las páginas interiores';