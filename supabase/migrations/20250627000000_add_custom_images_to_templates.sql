-- Agregar campos para imágenes custom en templates
ALTER TABLE story_style_templates
ADD COLUMN IF NOT EXISTS custom_images jsonb DEFAULT '{}'::jsonb;

-- Comentario explicativo de la estructura esperada
COMMENT ON COLUMN story_style_templates.custom_images IS 'Almacena las URLs de imágenes custom para preview en admin/style. Estructura: {cover_url: string, page_url: string, dedicatoria_url: string}';

-- Actualizar templates existentes con estructura vacía
UPDATE story_style_templates 
SET custom_images = '{}'::jsonb 
WHERE custom_images IS NULL;

-- Agregar campos de texto de muestra también
ALTER TABLE story_style_templates
ADD COLUMN IF NOT EXISTS custom_texts jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN story_style_templates.custom_texts IS 'Almacena los textos de muestra personalizados para preview. Estructura: {cover_text: string, page_text: string, dedicatoria_text: string}';

-- Actualizar templates existentes con estructura vacía
UPDATE story_style_templates 
SET custom_texts = '{}'::jsonb 
WHERE custom_texts IS NULL;