-- Add image generation preferences to prompts table
-- This migration adds support for storing size, quality, width, and height preferences
-- for image generation models in the prompts configuration

ALTER TABLE prompts 
ADD COLUMN size VARCHAR(50),
ADD COLUMN quality VARCHAR(50),
ADD COLUMN width INTEGER,
ADD COLUMN height INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN prompts.size IS 'Image size preference for OpenAI models (e.g., 1024x1024, 1792x1024)';
COMMENT ON COLUMN prompts.quality IS 'Image quality preference for OpenAI models (e.g., standard, hd)';
COMMENT ON COLUMN prompts.width IS 'Image width preference for Flux models (integer pixels)';
COMMENT ON COLUMN prompts.height IS 'Image height preference for Flux models (integer pixels)';

-- Add constraints for valid values
ALTER TABLE prompts 
ADD CONSTRAINT check_size_format 
CHECK (size IS NULL OR size ~ '^(\d+x\d+|auto)$');

ALTER TABLE prompts 
ADD CONSTRAINT check_quality_values 
CHECK (quality IS NULL OR quality IN ('standard', 'hd', 'auto', 'high', 'medium', 'low'));

ALTER TABLE prompts 
ADD CONSTRAINT check_width_positive 
CHECK (width IS NULL OR width > 0);

ALTER TABLE prompts 
ADD CONSTRAINT check_height_positive 
CHECK (height IS NULL OR height > 0);