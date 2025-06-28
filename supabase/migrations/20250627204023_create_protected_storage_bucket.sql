-- Crear bucket privado para almacenamiento protegido de imágenes
-- Este bucket reemplazará gradualmente el bucket público 'storage'

-- 1. Crear el nuevo bucket privado
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'protected-storage', 
  'protected-storage', 
  false, -- PRIVADO: requiere autenticación
  52428800, -- 50MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) 
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Políticas de acceso para el bucket protegido

-- Permitir a usuarios autenticados subir imágenes en sus propias carpetas
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'protected-storage' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir a usuarios leer sus propias imágenes
CREATE POLICY "Users can read their own images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'protected-storage' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir a usuarios actualizar sus propias imágenes
CREATE POLICY "Users can update their own images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'protected-storage' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'protected-storage' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir a usuarios eliminar sus propias imágenes
CREATE POLICY "Users can delete their own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'protected-storage' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Crear tabla para tracking de URLs firmadas y cache
CREATE TABLE IF NOT EXISTS signed_urls_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  file_path text NOT NULL,
  signed_url text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  accessed_count integer DEFAULT 0,
  last_accessed_at timestamptz,
  
  -- Índices para búsquedas eficientes
  UNIQUE(user_id, file_path)
);

-- Índice para limpieza de URLs expiradas
CREATE INDEX idx_signed_urls_expires_at ON signed_urls_cache(expires_at);

-- RLS para la tabla de cache
ALTER TABLE signed_urls_cache ENABLE ROW LEVEL SECURITY;

-- Solo el usuario dueño puede ver sus URLs firmadas
CREATE POLICY "Users can view their own signed URLs"
  ON signed_urls_cache
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Función para consultar cache de URLs firmadas
CREATE OR REPLACE FUNCTION get_cached_signed_url(
  p_file_path text
)
RETURNS TABLE (
  url text,
  expires_at timestamptz,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar autenticación
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  RETURN QUERY
  SELECT 
    suc.signed_url as url,
    suc.expires_at,
    (suc.expires_at > now() + interval '30 seconds') as is_valid
  FROM signed_urls_cache suc
  WHERE suc.user_id = auth.uid()
    AND suc.file_path = p_file_path
  ORDER BY suc.created_at DESC
  LIMIT 1;
END;
$$;

-- 5. Crear función para generar URLs firmadas con cache mejorado
CREATE OR REPLACE FUNCTION generate_protected_url(
  p_file_path text,
  p_expires_in integer DEFAULT 300 -- 5 minutos por defecto
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signed_url text;
  v_expires_at timestamptz;
  v_cached_result record;
BEGIN
  -- Verificar si el usuario está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Buscar en cache usando la función separada
  SELECT * INTO v_cached_result 
  FROM get_cached_signed_url(p_file_path);
  
  IF v_cached_result.url IS NOT NULL AND v_cached_result.is_valid THEN
    -- Actualizar contador de acceso
    UPDATE signed_urls_cache
    SET accessed_count = accessed_count + 1,
        last_accessed_at = now()
    WHERE user_id = auth.uid()
      AND file_path = p_file_path
      AND expires_at = v_cached_result.expires_at;
    
    RETURN v_cached_result.url;
  END IF;
  
  -- Calcular expiración para nueva URL
  v_expires_at := now() + (p_expires_in || ' seconds')::interval;
  
  -- Generar nueva URL firmada con URL base desde configuración
  -- NOTA: Esta función debe actualizarse para usar el servicio real de Supabase Storage
  -- en lugar de una URL construida manualmente
  v_signed_url := format(
    '%s/functions/v1/serve-protected-image?path=%s&token=%s&expires=%s',
    coalesce(
      (SELECT value FROM app_config WHERE key = 'supabase_url'), 
      'https://your-project.supabase.co'
    ),
    p_file_path,
    encode(gen_random_bytes(32), 'base64url'),
    extract(epoch from v_expires_at)::bigint
  );
  
  -- Guardar en cache
  INSERT INTO signed_urls_cache (user_id, file_path, signed_url, expires_at)
  VALUES (auth.uid(), p_file_path, v_signed_url, v_expires_at)
  ON CONFLICT (user_id, file_path) 
  DO UPDATE SET 
    signed_url = EXCLUDED.signed_url,
    expires_at = EXCLUDED.expires_at,
    created_at = now(),
    accessed_count = 1;
  
  RETURN v_signed_url;
END;
$$;

-- 5. Función para limpiar URLs expiradas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_signed_urls()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM signed_urls_cache
  WHERE expires_at < now() - interval '1 hour'
  RETURNING COUNT(*) INTO v_deleted_count;
  
  RETURN v_deleted_count;
END;
$$;

-- 6. Crear tabla de configuración de aplicación si no existe
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar configuración de URL base si no existe
INSERT INTO app_config (key, value, description)
VALUES ('supabase_url', 'https://your-project.supabase.co', 'URL base de Supabase para generar URLs firmadas')
ON CONFLICT (key) DO NOTHING;

-- RLS para app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden gestionar configuración de aplicación
CREATE POLICY "Only admins can manage app config" 
  ON app_config 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- 7. Crear tabla para configuración de protección de imágenes
CREATE TABLE IF NOT EXISTS image_protection_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watermark_enabled boolean DEFAULT true,
  watermark_opacity decimal(3,2) DEFAULT 0.15, -- 15% opacidad
  watermark_position text DEFAULT 'bottom-right', -- bottom-right, center, random
  signed_url_duration integer DEFAULT 300, -- 5 minutos
  rate_limit_per_minute integer DEFAULT 60,
  canvas_protection_enabled boolean DEFAULT true,
  right_click_disabled boolean DEFAULT true,
  dev_tools_detection boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Solo puede haber una configuración
CREATE UNIQUE INDEX idx_single_protection_config ON image_protection_config ((true));

-- Insertar configuración por defecto
INSERT INTO image_protection_config DEFAULT VALUES
ON CONFLICT DO NOTHING;

-- RLS para configuración
ALTER TABLE image_protection_config ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver/modificar la configuración
CREATE POLICY "Only admins can manage protection config"
  ON image_protection_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- 7. Función para migrar imágenes del bucket público al privado
CREATE OR REPLACE FUNCTION migrate_image_to_protected(
  p_public_path text,
  p_story_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_new_path text;
BEGIN
  -- Obtener el user_id del story
  SELECT user_id INTO v_user_id
  FROM stories
  WHERE id = p_story_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Story no encontrado';
  END IF;
  
  -- Construir nuevo path: user_id/story_id/filename
  v_new_path := format('%s/%s/%s', 
    v_user_id, 
    p_story_id,
    regexp_replace(p_public_path, '^.+/', '') -- Solo el nombre del archivo
  );
  
  -- Aquí iría la lógica de copia del archivo
  -- Por ahora solo retornamos el nuevo path
  
  RETURN v_new_path;
END;
$$;

-- Notificación de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Bucket protegido y sistema de URLs firmadas creado exitosamente';
  RAISE NOTICE '⚙️  Configuración de aplicación creada con URL placeholder';
  RAISE NOTICE '📋 Próximos pasos:';
  RAISE NOTICE '   1. Actualizar app_config.supabase_url con la URL real del proyecto';
  RAISE NOTICE '   2. Implementar edge function serve-protected-image';
  RAISE NOTICE '   3. Crear servicio imageProtectionService.ts';
  RAISE NOTICE '   4. Migrar imágenes existentes al nuevo bucket';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Para configurar la URL de Supabase:';
  RAISE NOTICE '   UPDATE app_config SET value = ''https://tu-proyecto.supabase.co'' WHERE key = ''supabase_url'';';
END $$;