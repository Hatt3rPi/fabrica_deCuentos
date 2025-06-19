-- Rollback de migraciones problemáticas que intentaban usar storage.policies
-- que no existe en todas las versiones de Supabase

-- Esta migración está vacía intencionalmente
-- Solo sirve para marcar que las migraciones anteriores problemáticas han sido reemplazadas

-- Las migraciones problemáticas eran:
-- 20250619140100_storage_bucket_policies.sql (intentaba usar storage.policies con JSONB)
-- 20250619140200_simple_storage_policies.sql (intentaba usar storage.policies con SQL)

-- Estas han sido reemplazadas por:
-- 20250619150000_fix_storage_policies.sql (usa el método estándar CREATE POLICY)

-- Comentario: Si necesitas revertir las políticas de storage, ejecuta:
-- DROP POLICY IF EXISTS "authenticated_upload_style_design" ON storage.objects;
-- DROP POLICY IF EXISTS "authenticated_update_style_design" ON storage.objects;
-- DROP POLICY IF EXISTS "public_read_style_design" ON storage.objects;
-- DROP POLICY IF EXISTS "authenticated_delete_style_design" ON storage.objects;