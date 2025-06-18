-- Add completed_at field to stories table for story completion tracking
-- This migration is additive and non-breaking

DO $$ 
BEGIN
  -- Add completed_at timestamp field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE stories ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    
    -- Add comment to document the field purpose
    COMMENT ON COLUMN stories.completed_at IS 'Timestamp when the story was marked as completed by the user';
  END IF;
  
  -- Create index for performance when filtering by completion status (only if it doesn't exist)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_stories_completion'
  ) THEN
    CREATE INDEX idx_stories_completion ON stories(status, completed_at) WHERE completed_at IS NOT NULL;
  END IF;
END $$;

-- Update existing completed stories (if any) to have a completed_at timestamp
-- This is safe even if no completed stories exist
UPDATE stories 
SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;