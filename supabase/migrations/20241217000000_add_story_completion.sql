-- Add completed_at field to stories table for story completion tracking
-- This migration is additive and non-breaking

-- Add completed_at timestamp field
ALTER TABLE stories ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing completed stories (if any) to have a completed_at timestamp
-- Uses updated_at as fallback for already completed stories
UPDATE stories 
SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;

-- Add comment to document the field purpose
COMMENT ON COLUMN stories.completed_at IS 'Timestamp when the story was marked as completed by the user';

-- Create index for performance when filtering by completion status
CREATE INDEX idx_stories_completion ON stories(status, completed_at) WHERE completed_at IS NOT NULL;