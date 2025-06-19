-- Agregar columnas para URLs de imágenes de fondo personalizadas
ALTER TABLE story_style_configs
ADD COLUMN cover_background_url TEXT,
ADD COLUMN page_background_url TEXT;

-- Actualizar comentarios
COMMENT ON COLUMN story_style_configs.cover_background_url IS 'URL de la imagen de fondo personalizada para la portada';
COMMENT ON COLUMN story_style_configs.page_background_url IS 'URL de la imagen de fondo personalizada para las páginas interiores';