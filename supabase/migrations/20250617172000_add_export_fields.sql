-- Add export-related fields to stories table
-- This migration is additive and non-breaking

DO $$ 
BEGIN
  -- Add export_url field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' 
    AND column_name = 'export_url'
  ) THEN
    ALTER TABLE stories ADD COLUMN export_url TEXT;
    COMMENT ON COLUMN stories.export_url IS 'URL of the exported PDF file in Supabase Storage';
  END IF;
  
  -- Add exported_at field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' 
    AND column_name = 'exported_at'
  ) THEN
    ALTER TABLE stories ADD COLUMN exported_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN stories.exported_at IS 'Timestamp when the story was exported to PDF';
  END IF;
  
  -- Create index for export queries (only if it doesn't exist)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_stories_export'
  ) THEN
    CREATE INDEX idx_stories_export ON stories(status, exported_at) WHERE exported_at IS NOT NULL;
  END IF;
END $$;