/*
  # Test character insertion
  
  Tests inserting a character with all required fields
*/

-- Test insertion with minimal required fields
INSERT INTO characters (
  user_id,
  name,
  description
) VALUES (
  auth.uid(),  -- Current user's ID
  'Test Character',
  '{"es": "Descripción de prueba", "en": "Test description"}'::jsonb
) RETURNING *;

-- Test insertion with all fields
INSERT INTO characters (
  user_id,
  name,
  description,
  age,
  reference_urls,
  thumbnail_url
) VALUES (
  auth.uid(),
  'Complete Test Character',
  '{"es": "Descripción completa", "en": "Complete description"}'::jsonb,
  '8 años',
  ARRAY['https://example.com/image1.jpg'],
  'https://example.com/thumbnail.jpg'
) RETURNING *;