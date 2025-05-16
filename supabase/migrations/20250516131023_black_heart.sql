/*
  # Verify characters table data

  1. Check table structure
  2. Query existing records
  3. Verify data integrity
*/

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'characters';

-- Query existing records
SELECT 
  id,
  user_id,
  name,
  age,
  description,
  reference_urls,
  thumbnail_url,
  created_at,
  updated_at
FROM characters
ORDER BY created_at DESC;

-- Verify foreign key constraints
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'characters'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Check RLS policies
SELECT
  pol.policyname,
  pol.cmd,
  pol.permissive,
  pol.roles,
  pol.qual,
  pol.with_check
FROM pg_policies pol
WHERE pol.tablename = 'characters';