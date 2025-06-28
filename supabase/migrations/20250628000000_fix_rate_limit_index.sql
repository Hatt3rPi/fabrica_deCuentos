-- Fix para índice de rate limiting problemático
-- Elimina índice con función VOLATILE y crea uno simple

-- Eliminar índice problemático si existe
DROP INDEX IF EXISTS idx_image_access_logs_rate_limit;

-- Crear índice simple sin predicado VOLATILE
-- El rate limiting se manejará a nivel de aplicación
CREATE INDEX IF NOT EXISTS idx_image_access_logs_rate_limit 
ON image_access_logs(user_id, created_at DESC);

-- Comentario explicativo
COMMENT ON INDEX idx_image_access_logs_rate_limit IS 
'Índice para rate limiting. El filtro temporal se aplica en queries, no en el índice.';

-- Notificación
DO $$
BEGIN
  RAISE NOTICE '✅ Índice de rate limiting corregido';
  RAISE NOTICE '🔧 Rate limiting se implementa a nivel de aplicación';
END $$;