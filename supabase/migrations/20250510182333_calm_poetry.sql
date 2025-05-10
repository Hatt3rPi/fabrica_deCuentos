/*
  # Add sprite sheet support to characters table

  1. Changes
    - Add `sprite_sheet` column to store sprite sheet data
    - Add `sprite_sheet_status` column to track generation status

  2. Security
    - No changes to RLS policies needed as existing ones cover the new columns
*/

ALTER TABLE characters
ADD COLUMN sprite_sheet jsonb DEFAULT NULL,
ADD COLUMN sprite_sheet_status text DEFAULT 'pending';

COMMENT ON COLUMN characters.sprite_sheet IS 'Stores the sprite sheet data including URL and metadata';
COMMENT ON COLUMN characters.sprite_sheet_status IS 'Status of sprite sheet generation: pending, generating, completed, failed';