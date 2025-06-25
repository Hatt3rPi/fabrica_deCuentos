-- Agregar campos de dedicatoria a la tabla stories
-- Permite almacenar texto personalizado, imagen y configuración de layout

ALTER TABLE stories 
ADD COLUMN dedicatoria_text TEXT,
ADD COLUMN dedicatoria_image_url TEXT,
ADD COLUMN dedicatoria_layout JSONB DEFAULT '{"layout": "imagen-arriba", "alignment": "centro", "imageSize": "mediana"}'::jsonb;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN stories.dedicatoria_text IS 'Texto personalizado de dedicatoria del cuento (máx 300 caracteres)';
COMMENT ON COLUMN stories.dedicatoria_image_url IS 'URL de imagen personalizada para la dedicatoria (opcional)';
COMMENT ON COLUMN stories.dedicatoria_layout IS 'Configuración de layout para la dedicatoria: {"layout": "imagen-arriba|imagen-abajo|imagen-izquierda|imagen-derecha", "alignment": "centro|izquierda|derecha", "imageSize": "pequena|mediana|grande"}';

-- Índice para mejorar performance en consultas que filtren por existencia de dedicatoria
CREATE INDEX idx_stories_dedicatoria_text ON stories(dedicatoria_text) WHERE dedicatoria_text IS NOT NULL;