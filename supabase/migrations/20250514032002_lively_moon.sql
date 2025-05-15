/*
  # Add character reference views

  1. Changes
    - Add reference_urls array to store the three character views
    - Add age field for character description
    - Update description to support bilingual content
    - Add thumbnail_url for initial sketch

  2. Security
    - Maintain existing RLS policies
*/

-- Modify characters table
ALTER TABLE characters DROP COLUMN variants;
ALTER TABLE characters DROP COLUMN selected_variant;
ALTER TABLE characters DROP COLUMN sprite_sheet;
ALTER TABLE characters DROP COLUMN sprite_sheet_status;

-- Add new columns
ALTER TABLE characters ADD COLUMN age text;
ALTER TABLE characters ADD COLUMN reference_urls text[] DEFAULT ARRAY[]::text[];
ALTER TABLE characters ADD COLUMN thumbnail_url text;

-- Convert description to JSONB for bilingual support
ALTER TABLE characters 
  ALTER COLUMN description TYPE jsonb 
  USING jsonb_build_object(
    'es', description,
    'en', description
  );

-- Add check constraint for reference_urls array size
ALTER TABLE characters 
  ADD CONSTRAINT reference_urls_length 
  CHECK (array_length(reference_urls, 1) <= 3);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;