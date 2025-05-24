/*
  # Enhance delete_full_story function to return image URLs
  
  1. Modified Function
    - `delete_full_story(story_id uuid)` now returns text[]
      - Returns an array of image URLs that need to be deleted from storage
      - This allows the Edge Function to handle storage cleanup
*/

-- Modify function to return image URLs for storage cleanup
CREATE OR REPLACE FUNCTION delete_full_story(story_id uuid)
RETURNS text[] AS $$
DECLARE
  orphaned_characters uuid[];
  image_urls text[] := '{}';
  character_ids text[] := '{}';
BEGIN
  -- Start a transaction to ensure atomicity
  BEGIN
    -- Get image URLs from story pages before deleting them
    SELECT array_agg(image_url)
    INTO image_urls
    FROM story_pages
    WHERE story_id = $1 AND image_url IS NOT NULL;
    
    -- Delete story pages
    DELETE FROM story_pages WHERE story_id = $1;
    
    -- Delete story designs
    DELETE FROM story_designs WHERE story_id = $1;
    
    -- Get characters associated with this story
    SELECT array_agg(character_id::text)
    INTO character_ids
    FROM story_characters
    WHERE story_id = $1;
    
    -- Get characters that will be orphaned
    orphaned_characters := array(
      SELECT character_id FROM story_characters 
      WHERE story_id = $1
    );
    
    -- Delete story-character relationships
    DELETE FROM story_characters WHERE story_id = $1;
    
    -- Delete orphaned characters (not used in other stories)
    DELETE FROM characters
    WHERE id = ANY(orphaned_characters)
      AND NOT EXISTS (
        SELECT 1 FROM story_characters WHERE character_id = characters.id
      );
    
    -- Delete the story itself
    DELETE FROM stories WHERE id = $1;
    
    -- If we get here, commit the transaction
    COMMIT;
    
    -- Return the array of image URLs and character IDs for storage cleanup
    RETURN image_urls || character_ids;
  EXCEPTION
    WHEN OTHERS THEN
      -- If any error occurs, rollback the transaction
      ROLLBACK;
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_full_story(uuid) TO authenticated;

