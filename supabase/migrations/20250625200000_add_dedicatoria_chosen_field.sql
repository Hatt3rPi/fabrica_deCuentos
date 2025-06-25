-- Agregar campo para almacenar la elección específica de dedicatoria
-- Permite distinguir entre "no eligió", "eligió sí" y "eligió no"

ALTER TABLE stories 
ADD COLUMN dedicatoria_chosen BOOLEAN DEFAULT NULL;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN stories.dedicatoria_chosen IS 'Elección específica del usuario sobre dedicatoria: NULL = no ha elegido, TRUE = eligió sí, FALSE = eligió no';

-- Índice para consultas analíticas sobre elección de dedicatoria
CREATE INDEX idx_stories_dedicatoria_chosen ON stories(dedicatoria_chosen) WHERE dedicatoria_chosen IS NOT NULL;

-- Actualizar registros existentes donde hay dedicatoria_text como TRUE
UPDATE stories 
SET dedicatoria_chosen = TRUE 
WHERE dedicatoria_text IS NOT NULL AND dedicatoria_text != '';

-- Los registros sin dedicatoria_text se mantienen como NULL (no han elegido)