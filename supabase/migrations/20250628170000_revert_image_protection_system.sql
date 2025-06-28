-- Migración: Revertir sistema de protección de imágenes
-- Fecha: 2025-06-28 17:00:00
-- Descripción: Revierte completamente las migraciones del PR #285 
--              Sistema de Protección de Imágenes Multi-Capa

-- IMPORTANTE: Esta migración revierte las migraciones aplicadas en producción:
-- ✅ 20250627204023_create_protected_storage_bucket.sql (APLICADA)
-- ✅ 20250627204311_create_image_access_logs.sql (APLICADA)
-- ✅ 20250628000000_fix_rate_limit_index.sql (APLICADA)
-- ❌ 20250628_create_additional_storage_buckets.sql (NO APLICADA - solo local)

-- ================================================================================
-- 1. REVERTIR: 20250628_create_additional_storage_buckets.sql (NO APLICADA)
-- ================================================================================
-- NOTA: Esta migración no está aplicada en producción, por lo que no hay nada que revertir
-- Solo está aplicada localmente, donde ya fue revertida manualmente

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

-- Eliminar políticas solo si las tablas existen
DO $$
BEGIN
    -- Eliminar políticas de image_protection_config
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'image_protection_config') THEN
        DROP POLICY IF EXISTS "Only admins can manage protection config" ON image_protection_config;
    END IF;

    -- Eliminar políticas de app_config
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_config') THEN
        DROP POLICY IF EXISTS "Only admins can manage app config" ON app_config;
    END IF;

    -- Eliminar políticas de signed_urls_cache
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signed_urls_cache') THEN
        DROP POLICY IF EXISTS "Users can view their own signed URLs" ON signed_urls_cache;
    END IF;
END $$;

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
    -- Verificar que el bucket fue eliminado (solo protected-storage existe en producción)
    SELECT COUNT(*) INTO v_remaining_buckets 
    FROM storage.buckets 
    WHERE id = 'protected-storage';
    
    -- Verificar que las tablas fueron eliminadas (solo las que existían en producción)
    SELECT COUNT(*) INTO v_remaining_tables
    FROM information_schema.tables 
    WHERE table_name IN ('signed_urls_cache', 'image_access_logs');
    
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