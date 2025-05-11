/*
  # Add comments to sprite sheet columns
  
  1. Changes
    - Add descriptive comments to sprite_sheet and sprite_sheet_status columns
*/

COMMENT ON COLUMN characters.sprite_sheet IS 'Stores the sprite sheet data including URL and metadata';
COMMENT ON COLUMN characters.sprite_sheet_status IS 'Status of sprite sheet generation: pending, generating, completed, failed';