/*
  # Add status column to stories table

  1. Changes
    - Add 'status' column to 'stories' table with type TEXT and default value 'draft'
    - Add check constraint to ensure status is either 'draft' or 'completed'
    - Update existing rows to have 'draft' status
  
  2. Notes
    - Using DO block to safely add column if it doesn't exist
    - Adding check constraint to maintain data integrity
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE stories 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';

    ALTER TABLE stories 
    ADD CONSTRAINT stories_status_check 
    CHECK (status IN ('draft', 'completed'));
  END IF;
END $$;