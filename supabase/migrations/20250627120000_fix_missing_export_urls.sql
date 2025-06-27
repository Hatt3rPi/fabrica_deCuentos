-- Migración para corregir cuentos completados sin export_url
-- Este problema ocurre cuando los cuentos fueron completados pero el PDF no se guardó en biblioteca

-- 1. Buscar cuentos completados sin export_url que tienen archivos en Storage
UPDATE stories 
SET export_url = (
  SELECT 
    CASE 
      WHEN objects.name IS NOT NULL THEN 
        'https://cwkhfuhdubhbvwwjzjpz.supabase.co/storage/v1/object/public/exports/' || objects.name
      ELSE NULL 
    END
  FROM storage.objects 
  WHERE objects.bucket_id = 'exports' 
    AND objects.name LIKE stories.id || '%'
    AND objects.name LIKE '%.pdf'
  LIMIT 1
)
WHERE status = 'completed' 
  AND export_url IS NULL 
  AND EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'exports' 
      AND name LIKE stories.id || '%'
      AND name LIKE '%.pdf'
  );

-- 2. Log cuántos registros fueron actualizados
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Actualizados % cuentos con URLs de export faltantes', updated_count;
END $$;

-- 3. Crear índice para búsquedas de export_url si no existe
CREATE INDEX IF NOT EXISTS idx_stories_export_url ON stories(export_url) WHERE export_url IS NOT NULL;

-- 4. Verificar resultados
-- Esta query mostrará el estado actual después de la migración
SELECT 
  COUNT(*) as total_completed,
  COUNT(export_url) as with_export_url,
  COUNT(*) - COUNT(export_url) as missing_export_url
FROM stories 
WHERE status = 'completed';