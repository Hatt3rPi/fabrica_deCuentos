-- Agregar campo para URL de imagen de fondo de dedicatoria
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS dedicatoria_background_url text;

-- Comentario explicativo
COMMENT ON COLUMN stories.dedicatoria_background_url IS 'URL de la imagen de fondo para la página de dedicatoria, configurada por el admin';