-- Add theme column to stories to store story theme for drafts
ALTER TABLE stories ADD COLUMN IF NOT EXISTS theme text;
