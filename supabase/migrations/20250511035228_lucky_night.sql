/*
  # Add sprite sheet status column

  1. Changes
    - Add sprite_sheet_status column to characters table
    - Add comments for clarity

  2. Notes
    - sprite_sheet column already exists, so we only add the status column
*/

ALTER TABLE characters
ADD COLUMN sprite_sheet_status text DEFAULT 'pending';

COMMENT ON COLUMN characters.sprite_sheet IS 'Stores the sprite sheet data including URL and metadata';
COMMENT ON COLUMN characters.sprite_sheet_status IS 'Status of sprite sheet generation: pending, generating, completed, failed';