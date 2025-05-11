/*
  # Add system settings table
  
  1. New Tables
    - `system_settings` 
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `updated_at` (timestamp)
      - `updated_by` (uuid)
  
  2. Security
    - Enable RLS
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy for admin read access
CREATE POLICY "Admins can read system settings"
ON system_settings
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'fabarca212@gmail.com'
);

-- Policy for admin write access
CREATE POLICY "Admins can modify system settings"
ON system_settings
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'fabarca212@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'fabarca212@gmail.com'
);

-- Insert default settings
INSERT INTO system_settings (key, value)
VALUES (
  'image_generation',
  jsonb_build_object(
    'engine', 'openai',
    'last_updated', CURRENT_TIMESTAMP,
    'options', jsonb_build_object(
      'openai', jsonb_build_object(
        'model', 'dall-e-3',
        'quality', 'standard'
      ),
      'stable_diffusion', jsonb_build_object(
        'model', 'stable-diffusion-xl-1024-v1-0',
        'cfg_scale', 7,
        'steps', 30
      )
    )
  )
);