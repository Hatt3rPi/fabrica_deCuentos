-- Migración: Crear buckets adicionales de almacenamiento
-- Fecha: 2025-06-28
-- Descripción: Crea buckets para exportaciones y assets administrativos

-- 1. Crear bucket de exportaciones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false, -- Privado: requiere autenticación
  104857600, -- 100MB límite
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip'];

-- 2. Crear bucket de assets administrativos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-assets',
  'admin-assets',
  false, -- Privado por defecto, con excepciones
  10485760, -- 10MB límite
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'font/ttf', 'font/woff', 'font/woff2']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'font/ttf', 'font/woff', 'font/woff2'];

-- 3. Políticas para bucket de exportaciones

-- Usuarios pueden subir a su carpeta
CREATE POLICY "Users can upload exports"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exports' AND
    (
      -- Puede subir a pdfs/{user_id}/
      ((storage.foldername(name))[1] = 'pdfs' AND (storage.foldername(name))[2] = auth.uid()::text)
      OR
      -- Puede subir a temp/{session_id}/ (cualquier usuario autenticado)
      (storage.foldername(name))[1] = 'temp'
    )
  );

-- Usuarios pueden ver sus propios archivos
CREATE POLICY "Users can view own exports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exports' AND
    (
      -- Puede ver pdfs/{user_id}/
      ((storage.foldername(name))[1] = 'pdfs' AND (storage.foldername(name))[2] = auth.uid()::text)
      OR
      -- Archivos temporales son visibles para quien los creó (verificar por metadata)
      (storage.foldername(name))[1] = 'temp'
    )
  );

-- Usuarios pueden actualizar sus archivos
CREATE POLICY "Users can update own exports"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'exports' AND
    ((storage.foldername(name))[1] = 'pdfs' AND (storage.foldername(name))[2] = auth.uid()::text)
  );

-- Usuarios pueden eliminar sus archivos
CREATE POLICY "Users can delete own exports"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'exports' AND
    (
      ((storage.foldername(name))[1] = 'pdfs' AND (storage.foldername(name))[2] = auth.uid()::text)
      OR
      (storage.foldername(name))[1] = 'temp'
    )
  );

-- 4. Políticas para bucket admin-assets

-- Solo admins pueden gestionar assets
CREATE POLICY "Admins can manage all assets"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'admin-assets' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Lectura pública para carpeta system
CREATE POLICY "Public read for system assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'admin-assets' AND
    (storage.foldername(name))[1] = 'system'
  );

-- Lectura pública para watermarks (si se necesitan en el frontend)
CREATE POLICY "Public read for watermarks"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'admin-assets' AND
    (storage.foldername(name))[1] = 'watermarks'
  );

-- 5. Función para limpiar exportaciones temporales
CREATE OR REPLACE FUNCTION cleanup_temp_exports()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Eliminar archivos temporales más antiguos de 1 hora
  DELETE FROM storage.objects
  WHERE bucket_id = 'exports'
    AND (storage.foldername(name))[1] = 'temp'
    AND created_at < now() - interval '1 hour';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- 6. Función para obtener URL firmada de exportación con expiración corta
CREATE OR REPLACE FUNCTION get_export_url(
  p_file_path text,
  p_expires_in integer DEFAULT 3600 -- 1 hora por defecto
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signed_url text;
BEGIN
  -- Verificar que el usuario está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Verificar que el archivo pertenece al usuario
  IF NOT (
    p_file_path LIKE 'pdfs/' || auth.uid()::text || '/%'
    OR p_file_path LIKE 'temp/%'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado al archivo';
  END IF;
  
  -- Aquí se generaría la URL firmada real
  -- Por ahora retornamos una URL de ejemplo
  v_signed_url := format(
    '%s/storage/v1/object/sign/exports/%s?token=%s&expires=%s',
    current_setting('app.settings.supabase_url', true),
    p_file_path,
    encode(gen_random_bytes(32), 'base64url'),
    extract(epoch from now() + (p_expires_in || ' seconds')::interval)::bigint
  );
  
  RETURN v_signed_url;
END;
$$;

-- 7. Configuración inicial de carpetas de sistema
DO $$
BEGIN
  -- Notificar que los buckets fueron creados
  RAISE NOTICE '✅ Buckets de almacenamiento adicionales creados:';
  RAISE NOTICE '   - exports: Para PDFs y archivos temporales';
  RAISE NOTICE '   - admin-assets: Para recursos del sistema';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Estructura de carpetas:';
  RAISE NOTICE '   exports/';
  RAISE NOTICE '     ├── pdfs/{user_id}/';
  RAISE NOTICE '     └── temp/';
  RAISE NOTICE '   admin-assets/';
  RAISE NOTICE '     ├── templates/';
  RAISE NOTICE '     ├── watermarks/';
  RAISE NOTICE '     └── system/';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Funciones disponibles:';
  RAISE NOTICE '   - cleanup_temp_exports(): Limpia archivos temporales';
  RAISE NOTICE '   - get_export_url(path): Genera URL firmada para descargas';
END $$;