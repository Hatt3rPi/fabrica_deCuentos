-- Migración: Revertir sistema de protección de imágenes
-- Fecha: 2025-06-28 17:00:00
-- Descripción: Revierte completamente las migraciones del PR #285 
--              Sistema de Protección de Imágenes Multi-Capa

-- IMPORTANTE: Esta migración revierte los siguientes archivos:
-- - 20250627204023_create_protected_storage_bucket.sql
-- - 20250627204311_create_image_access_logs.sql  
-- - 20250628000000_fix_rate_limit_index.sql
-- - 20250628_create_additional_storage_buckets.sql

-- ================================================================================
-- 1. REVERTIR: 20250628_create_additional_storage_buckets.sql
-- ================================================================================

-- Eliminar funciones de la migración más reciente
DROP FUNCTION IF EXISTS cleanup_temp_exports();
DROP FUNCTION IF EXISTS get_export_url(text, integer);

-- Eliminar políticas de admin-assets
DROP POLICY IF EXISTS "Admins can manage all assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read for system assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read for watermarks" ON storage.objects;

-- Eliminar políticas de exports
DROP POLICY IF EXISTS "Users can upload exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own exports" ON storage.objects;

-- Eliminar buckets (solo si están vacíos)
DELETE FROM storage.buckets WHERE id IN ('exports', 'admin-assets');

-- ================================================================================
-- 2. REVERTIR: 20250628000000_fix_rate_limit_index.sql
-- ================================================================================

-- Eliminar índice de rate limiting
DROP INDEX IF EXISTS idx_image_access_logs_user_hour_bucket;

-- ================================================================================
-- 3. REVERTIR: 20250627204311_create_image_access_logs.sql
-- ================================================================================

-- Eliminar funciones de logging
DROP FUNCTION IF EXISTS get_image_access_stats(text, interval);
DROP FUNCTION IF EXISTS detect_suspicious_image_activity(integer);
DROP FUNCTION IF EXISTS cleanup_old_image_access_logs(interval);

-- Eliminar tabla de logs
DROP TABLE IF EXISTS image_access_logs;

-- ================================================================================
-- 4. REVERTIR: 20250627204023_create_protected_storage_bucket.sql (PRINCIPAL)
-- ================================================================================

-- Eliminar funciones RPC principales
DROP FUNCTION IF EXISTS get_cached_signed_url(text);
DROP FUNCTION IF EXISTS generate_protected_url(text, integer);
DROP FUNCTION IF EXISTS cleanup_expired_signed_urls();
DROP FUNCTION IF EXISTS migrate_image_to_protected(text, uuid);

-- Eliminar políticas de image_protection_config
DROP POLICY IF EXISTS "Only admins can manage protection config" ON image_protection_config;

-- Eliminar políticas de app_config
DROP POLICY IF EXISTS "Only admins can manage app config" ON app_config;

-- Eliminar políticas de signed_urls_cache
DROP POLICY IF EXISTS "Users can view their own signed URLs" ON signed_urls_cache;

-- Eliminar tablas del sistema de protección
DROP TABLE IF EXISTS image_protection_config;
DROP TABLE IF EXISTS app_config;
DROP TABLE IF EXISTS signed_urls_cache;

-- Eliminar políticas del bucket protected-storage
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Eliminar el bucket protected-storage (solo si está vacío)
DELETE FROM storage.buckets WHERE id = 'protected-storage';

-- ================================================================================
-- VERIFICACIONES Y NOTIFICACIONES
-- ================================================================================

DO $$
DECLARE
    v_remaining_buckets integer;
    v_remaining_tables integer;
    v_remaining_functions integer;
BEGIN
    -- Verificar que los buckets fueron eliminados
    SELECT COUNT(*) INTO v_remaining_buckets 
    FROM storage.buckets 
    WHERE id IN ('protected-storage', 'exports', 'admin-assets');
    
    -- Verificar que las tablas fueron eliminadas
    SELECT COUNT(*) INTO v_remaining_tables
    FROM information_schema.tables 
    WHERE table_name IN ('signed_urls_cache', 'image_protection_config', 'app_config', 'image_access_logs');
    
    -- Verificar que las funciones fueron eliminadas
    SELECT COUNT(*) INTO v_remaining_functions
    FROM information_schema.routines 
    WHERE routine_name IN ('get_cached_signed_url', 'generate_protected_url', 'cleanup_expired_signed_urls');
    
    -- Reportar resultados
    RAISE NOTICE '🔄 REVERT COMPLETADO - Sistema de Protección de Imágenes';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Buckets eliminados: % restantes', v_remaining_buckets;
    RAISE NOTICE '✅ Tablas eliminadas: % restantes', v_remaining_tables;
    RAISE NOTICE '✅ Funciones eliminadas: % restantes', v_remaining_functions;
    RAISE NOTICE '';
    
    IF v_remaining_buckets = 0 AND v_remaining_tables = 0 AND v_remaining_functions = 0 THEN
        RAISE NOTICE '✅ REVERT EXITOSO: Sistema completamente revertido';
        RAISE NOTICE '🎯 Los errores 404 de get_cached_signed_url han sido resueltos';
    ELSE
        RAISE WARNING '⚠️  REVERT PARCIAL: Algunos elementos no pudieron ser eliminados';
        RAISE NOTICE '💡 Esto puede deberse a dependencias o datos existentes';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. Las imágenes existentes en bucket "storage" siguen funcionando';
    RAISE NOTICE '   2. Reiniciar aplicación para eliminar errores 404';
    RAISE NOTICE '   3. El sistema ahora usa solo imágenes públicas estándar';
END $$;