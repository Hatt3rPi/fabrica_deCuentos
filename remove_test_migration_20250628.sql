-- ELIMINAR MIGRACIÓN DE PRUEBA 20250628
-- Ejecutar en Supabase Dashboard > SQL Editor
-- 
-- Esta migración contenía funcionalidad de prueba de buckets de storage
-- que ya no es necesaria para el sistema de producción

-- 1. VERIFICAR QUE LA MIGRACIÓN EXISTE
SELECT 
    version,
    name,
    executed_at,
    'MIGRACIÓN A ELIMINAR' as status
FROM supabase_migrations.schema_migrations 
WHERE version = '20250628';

-- 2. ELIMINAR OBJETOS CREADOS POR LA MIGRACIÓN (si existen)

-- Eliminar políticas de storage creadas por la migración
DROP POLICY IF EXISTS "Users can upload exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own exports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read for system assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read for watermarks" ON storage.objects;

-- Eliminar funciones creadas por la migración
DROP FUNCTION IF EXISTS cleanup_temp_exports();
DROP FUNCTION IF EXISTS get_export_url(text, integer);

-- Eliminar buckets de storage de prueba
DELETE FROM storage.buckets WHERE id IN ('exports', 'admin-assets');

-- 3. ELIMINAR EL REGISTRO DE LA MIGRACIÓN
DELETE FROM supabase_migrations.schema_migrations 
WHERE version = '20250628';

-- 4. VERIFICAR ELIMINACIÓN
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ MIGRACIÓN 20250628 ELIMINADA EXITOSAMENTE'
        ELSE '❌ MIGRACIÓN 20250628 TODAVÍA EXISTE'
    END as resultado
FROM supabase_migrations.schema_migrations 
WHERE version = '20250628';

-- 5. VERIFICAR ESTADO FINAL DEL HISTORIAL
SELECT 
    version,
    name,
    executed_at,
    CASE 
        WHEN version > '20250628' THEN '⬆️ POSTERIOR A LA ELIMINADA'
        ELSE '⬇️ ANTERIOR A LA ELIMINADA'
    END as relacion
FROM supabase_migrations.schema_migrations 
WHERE version BETWEEN '20250625' AND '20250701'
ORDER BY version DESC;

-- 6. MENSAJE FINAL
SELECT '🎯 Migración de prueba 20250628 eliminada. Ahora puedes ejecutar npx supabase db push sin problemas.' as mensaje;