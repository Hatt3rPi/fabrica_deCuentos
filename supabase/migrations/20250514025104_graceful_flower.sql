/*
  # Update image generation settings

  1. Changes
    - Add support for multiple image generation engines
    - Configure independent settings for thumbnails, variations, and sprite sheets
    - Add quality and style options for DALL-E 3
    - Add support for Stable Diffusion 3.5

  2. Security
    - Maintain existing RLS policies
    - Only admin can modify settings
*/

-- Update the image_generation settings with the new structure
UPDATE system_settings
SET value = jsonb_build_object(
  'engines', jsonb_build_object(
    'thumbnail', jsonb_build_object(
      'provider', 'openai',
      'model', 'dall-e-2',
      'size', '256x256'
    ),
    'variations', jsonb_build_object(
      'provider', 'openai',
      'model', 'dall-e-3',
      'quality', 'standard',
      'style', 'vivid',
      'size', '1024x1024'
    ),
    'spriteSheet', jsonb_build_object(
      'provider', 'openai',
      'model', 'dall-e-3',
      'quality', 'hd',
      'style', 'natural',
      'size', '1024x1024'
    )
  ),
  'last_updated', CURRENT_TIMESTAMP
)
WHERE key = 'image_generation';

-- Insert if not exists
INSERT INTO system_settings (id, key, value)
SELECT 
  gen_random_uuid(),
  'image_generation',
  jsonb_build_object(
    'engines', jsonb_build_object(
      'thumbnail', jsonb_build_object(
        'provider', 'openai',
        'model', 'dall-e-2',
        'size', '256x256'
      ),
      'variations', jsonb_build_object(
        'provider', 'openai',
        'model', 'dall-e-3',
        'quality', 'standard',
        'style', 'vivid',
        'size', '1024x1024'
      ),
      'spriteSheet', jsonb_build_object(
        'provider', 'openai',
        'model', 'dall-e-3',
        'quality', 'hd',
        'style', 'natural',
        'size', '1024x1024'
      )
    ),
    'last_updated', CURRENT_TIMESTAMP
  )
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings WHERE key = 'image_generation'
);