/*
  # Enhance delete_full_story function to return image URLs
  
  1. Modified Function
    - `delete_full_story(story_id uuid)` now returns text[]
      - Devuelve un array con las URLs de imagen y los IDs de personajes huérfanos
        para que la Edge Function maneje la limpieza en Storage.
*/

-- 1) Elimina la definición anterior para evitar el error de cambio de tipo
DROP FUNCTION IF EXISTS delete_full_story(uuid);

-- 2) Crea la nueva versión que retorna las URLs y los character_ids
CREATE OR REPLACE FUNCTION delete_full_story(p_story_id uuid)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  orphaned_characters uuid[];
  image_urls         text[] := '{}';
  character_ids      text[] := '{}';
BEGIN
  -- Inicia un bloque anidado para control de transacción
  BEGIN
    -- Recopila URLs de imágenes antes de borrarlas
    SELECT array_agg(image_url)
    INTO image_urls
    FROM story_pages
    WHERE story_id = p_story_id
      AND image_url IS NOT NULL;

    -- Borra páginas y diseños asociados
    DELETE FROM story_pages   WHERE story_id = p_story_id;
    DELETE FROM story_designs WHERE story_id = p_story_id;

    -- Recopila IDs de personajes relacionados
    SELECT array_agg(character_id::text)
    INTO character_ids
    FROM story_characters
    WHERE story_id = p_story_id;

    -- Identifica personajes que quedarán huérfanos
    SELECT array_agg(character_id)
    INTO orphaned_characters
    FROM story_characters
    WHERE story_id = p_story_id;

    -- Borra relaciones y personajes huérfanos
    DELETE FROM story_characters WHERE story_id = p_story_id;
    DELETE FROM characters
    WHERE id = ANY(orphaned_characters)
      AND NOT EXISTS (
        SELECT 1
        FROM story_characters sc
        WHERE sc.character_id = characters.id
      );

    -- Borra la historia principal
    DELETE FROM stories WHERE id = p_story_id;

    -- Confirma el bloque y retorna el array combinado
    COMMIT;
    RETURN image_urls || character_ids;

  EXCEPTION
    WHEN OTHERS THEN
      -- Reversa en caso de fallo
      ROLLBACK;
      RAISE;
  END;
END;
$$;

-- 3) Asegura permisos de ejecución
GRANT EXECUTE ON FUNCTION delete_full_story(uuid) TO authenticated;
