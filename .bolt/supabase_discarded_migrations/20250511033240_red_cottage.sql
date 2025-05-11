ALTER TABLE characters
ADD COLUMN sprite_sheet jsonb DEFAULT NULL,
ADD COLUMN sprite_sheet_status text DEFAULT 'pending';

COMMENT ON COLUMN characters.sprite_sheet IS 'Stores the sprite sheet data including URL and metadata';
COMMENT ON COLUMN characters.sprite_sheet_status IS 'Status of sprite sheet generation: pending, generating, completed, failed';