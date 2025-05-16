/*
  # Test character data insertion

  1. Test Data
    - Creates test records in the characters table
    - Validates different field combinations
    - Uses proper data types and formats

  2. Validation
    - Ensures user exists before insertion
    - Tests both minimal and complete record creation
    - Verifies JSONB and array handling
*/

-- First ensure the test user exists (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = '00000000-0000-0000-0000-000000000000'
    ) THEN
        INSERT INTO auth.users (id, email)
        VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com');
    END IF;
END $$;

-- Test insertion with minimal required fields
INSERT INTO characters (
  user_id,
  name,
  description
) VALUES (
  '00000000-0000-0000-0000-000000000000',  -- Test user ID
  'Test Character',
  '{"es": "Descripción de prueba", "en": "Test description"}'::jsonb
);

-- Test insertion with all fields
INSERT INTO characters (
  user_id,
  name,
  description,
  age,
  reference_urls,
  thumbnail_url
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Complete Test Character',
  '{"es": "Descripción completa", "en": "Complete description"}'::jsonb,
  '8 años',
  ARRAY['https://example.com/image1.jpg'],
  'https://example.com/thumbnail.jpg'
);