/*
  # Add delete_story_preserve_characters function

  Esta función elimina una historia y sus páginas y diseños asociados sin borrar los personajes relacionados. Devuelve las URLs de las imágenes para que la aplicación pueda limpiar los archivos en storage.
*/

CREATE OR REPLACE FUNCTION delete_story_preserve_characters(p_story_id uuid)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  image_urls text[] := '{}';
BEGIN
  BEGIN
    SELECT array_agg(image_url)
      INTO image_urls
      FROM story_pages
      WHERE story_id = p_story_id
        AND image_url IS NOT NULL;

    DELETE FROM story_pages WHERE story_id = p_story_id;
    DELETE FROM story_designs WHERE story_id = p_story_id;
    DELETE FROM story_characters WHERE story_id = p_story_id;
    DELETE FROM stories WHERE id = p_story_id;

    COMMIT;
    RETURN image_urls;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_story_preserve_characters(uuid) TO authenticated;
