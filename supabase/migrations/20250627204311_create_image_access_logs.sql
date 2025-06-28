-- Crear tabla para logging de accesos a imágenes protegidas
-- Usado para auditoría, rate limiting y analytics

CREATE TABLE IF NOT EXISTS image_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  file_path text NOT NULL,
  with_watermark boolean DEFAULT false,
  ip_address inet,
  user_agent text,
  referer text,
  response_size integer,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now(),
  
  -- Campos adicionales para analytics
  device_type text, -- mobile, desktop, tablet
  browser text,
  os text
);

-- Índices para consultas eficientes
CREATE INDEX idx_image_access_logs_user_created ON image_access_logs(user_id, created_at DESC);
CREATE INDEX idx_image_access_logs_file_path ON image_access_logs(file_path);
CREATE INDEX idx_image_access_logs_created_at ON image_access_logs(created_at DESC);
CREATE INDEX idx_image_access_logs_ip_created ON image_access_logs(ip_address, created_at DESC);

-- Índice parcial para rate limiting (solo últimos 5 minutos)
CREATE INDEX idx_image_access_logs_rate_limit ON image_access_logs(user_id, created_at) 
WHERE created_at > (now() - interval '5 minutes');

-- RLS para la tabla de logs
ALTER TABLE image_access_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver todos los logs
CREATE POLICY "Only admins can view all access logs"
  ON image_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Los usuarios pueden ver sus propios logs
CREATE POLICY "Users can view their own access logs"
  ON image_access_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Solo la edge function puede insertar logs (usando service role)
CREATE POLICY "Service role can insert access logs"
  ON image_access_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Función para limpiar logs antiguos (ejecutar diariamente)
CREATE OR REPLACE FUNCTION cleanup_old_image_access_logs()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count integer;
  v_retention_days integer := 90; -- Retener logs por 90 días
BEGIN
  DELETE FROM image_access_logs
  WHERE created_at < now() - (v_retention_days || ' days')::interval
  RETURNING COUNT(*) INTO v_deleted_count;
  
  RETURN v_deleted_count;
END;
$$;

-- Función para obtener estadísticas de acceso a imágenes
CREATE OR REPLACE FUNCTION get_image_access_stats(
  p_user_id uuid DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_requests bigint,
  unique_files bigint,
  watermarked_requests bigint,
  avg_processing_time_ms numeric,
  top_files jsonb,
  hourly_distribution jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar permisos
  IF p_user_id IS NULL AND NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'operator')
    AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RAISE EXCEPTION 'Sin permisos para ver estadísticas globales';
  END IF;

  -- Si no es admin, solo puede ver sus propios stats
  IF p_user_id IS NULL AND NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    p_user_id := auth.uid();
  END IF;

  -- Fechas por defecto (últimos 30 días)
  p_start_date := COALESCE(p_start_date, now() - interval '30 days');
  p_end_date := COALESCE(p_end_date, now());

  RETURN QUERY
  WITH stats_data AS (
    SELECT 
      COUNT(*) as total_requests,
      COUNT(DISTINCT file_path) as unique_files,
      COUNT(*) FILTER (WHERE with_watermark = true) as watermarked_requests,
      AVG(processing_time_ms) as avg_processing_time_ms
    FROM image_access_logs
    WHERE created_at BETWEEN p_start_date AND p_end_date
      AND (p_user_id IS NULL OR user_id = p_user_id)
  ),
  top_files_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'file_path', file_path,
        'access_count', access_count
      ) ORDER BY access_count DESC
    ) as top_files
    FROM (
      SELECT file_path, COUNT(*) as access_count
      FROM image_access_logs
      WHERE created_at BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR user_id = p_user_id)
      GROUP BY file_path
      ORDER BY access_count DESC
      LIMIT 10
    ) t
  ),
  hourly_data AS (
    SELECT jsonb_object_agg(
      hour_bucket,
      request_count
    ) as hourly_distribution
    FROM (
      SELECT 
        EXTRACT(hour FROM created_at) as hour_bucket,
        COUNT(*) as request_count
      FROM image_access_logs
      WHERE created_at BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR user_id = p_user_id)
      GROUP BY EXTRACT(hour FROM created_at)
      ORDER BY hour_bucket
    ) h
  )
  SELECT 
    s.total_requests,
    s.unique_files,
    s.watermarked_requests,
    s.avg_processing_time_ms,
    COALESCE(tf.top_files, '[]'::jsonb),
    COALESCE(h.hourly_distribution, '{}'::jsonb)
  FROM stats_data s
  CROSS JOIN top_files_data tf
  CROSS JOIN hourly_data h;
END;
$$;

-- Función para detectar actividad sospechosa
CREATE OR REPLACE FUNCTION detect_suspicious_image_activity()
RETURNS TABLE (
  user_id uuid,
  ip_address inet,
  request_count bigint,
  unique_files bigint,
  time_period text,
  risk_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo admins pueden ejecutar esta función
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RAISE EXCEPTION 'Sin permisos para detectar actividad sospechosa';
  END IF;

  RETURN QUERY
  WITH suspicious_activity AS (
    -- Usuarios con demasiadas solicitudes en la última hora
    SELECT 
      ial.user_id,
      ial.ip_address,
      COUNT(*) as request_count,
      COUNT(DISTINCT file_path) as unique_files,
      'last_hour' as time_period,
      CASE 
        WHEN COUNT(*) > 1000 THEN 'high'
        WHEN COUNT(*) > 500 THEN 'medium'
        ELSE 'low'
      END as risk_level
    FROM image_access_logs ial
    WHERE created_at > now() - interval '1 hour'
    GROUP BY ial.user_id, ial.ip_address
    HAVING COUNT(*) > 100 -- Más de 100 requests por hora es sospechoso
    
    UNION ALL
    
    -- IPs accediendo a imágenes de múltiples usuarios
    SELECT 
      ial.user_id,
      ial.ip_address,
      COUNT(*) as request_count,
      COUNT(DISTINCT file_path) as unique_files,
      'cross_user_access' as time_period,
      'high' as risk_level
    FROM image_access_logs ial
    WHERE created_at > now() - interval '24 hours'
    GROUP BY ial.user_id, ial.ip_address
    HAVING COUNT(DISTINCT (string_to_array(file_path, '/'))[1]) > 1 -- Acceso a archivos de múltiples usuarios
  )
  SELECT * FROM suspicious_activity
  ORDER BY 
    CASE risk_level 
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      ELSE 1
    END DESC,
    request_count DESC;
END;
$$;

-- Notificación de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de logging de acceso a imágenes creado exitosamente';
  RAISE NOTICE '📊 Funciones disponibles:';
  RAISE NOTICE '   - get_image_access_stats(): Estadísticas de acceso';
  RAISE NOTICE '   - detect_suspicious_image_activity(): Detectar actividad sospechosa';
  RAISE NOTICE '   - cleanup_old_image_access_logs(): Limpiar logs antiguos';
END $$;