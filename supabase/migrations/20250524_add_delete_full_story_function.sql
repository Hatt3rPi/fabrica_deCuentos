/*
  # Add delete_full_story function and performance indexes
  
  1. New Function
    - `delete_full_story(story_id uuid)`
      - Deletes a story and all related records in a transaction
      - Removes orphaned characters (not used in other stories)
      
  2. New Indexes
    - `idx_story_pages_story_id` on story_pages(story_id)
    - `idx_story_designs_story_id` on story_designs(story_id)
    - `idx_story_characters_story_id` on story_characters(story_id)
    - `idx_story_characters_character_id` on story_characters(character_id)
*/

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON story_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_story_designs_story_id ON story_designs(story_id);
CREATE INDEX IF NOT EXISTS idx_story_characters_story_id ON story_characters(story_id);
CREATE INDEX IF NOT EXISTS idx_story_characters_character_id ON story_characters(character_id);

-- Create function to delete a story and all related records
CREATE OR REPLACE FUNCTION delete_full_story(story_id uuid)
RETURNS void AS $$
DECLARE
  orphaned_characters uuid[];
BEGIN
  -- Start a transaction to ensure atomicity
  BEGIN
    -- Delete story pages
    DELETE FROM story_pages WHERE story_id = $1;
    
    -- Delete story designs
    DELETE FROM story_designs WHERE story_id = $1;
    
    -- Get characters associated with this story
    orphaned_characters := array(
      SELECT character_id FROM story_characters WHERE story_id = $1
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

