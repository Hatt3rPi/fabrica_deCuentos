-- Agregar sistema de tracking de fulfillment para pedidos de cuentos completados
-- Esta migración agrega funcionalidad para gestionar el flujo operacional post-completación
-- DEPENDENCIA: Requiere migración 20250627110806_add_user_roles_system.sql (se ejecuta automáticamente antes por timestamp)

-- 1. Agregar campo fulfillment_status a stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(20);

-- Agregar comentario explicativo
COMMENT ON COLUMN stories.fulfillment_status IS 'Estado operacional del pedido: pendiente, imprimiendo, enviando, entregado, cancelado';

-- 2. Crear tabla de historial de cambios de estado
CREATE TABLE IF NOT EXISTS fulfillment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para búsquedas por story
CREATE INDEX IF NOT EXISTS idx_fulfillment_history_story ON fulfillment_history(story_id, created_at DESC);

-- 3. Crear tabla de información de envío
CREATE TABLE IF NOT EXISTS shipping_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE UNIQUE,
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(50),
  recipient_email VARCHAR(255),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'CL',
  tracking_number VARCHAR(100),
  courier VARCHAR(50),
  estimated_delivery DATE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para búsquedas por tracking
CREATE INDEX IF NOT EXISTS idx_shipping_tracking ON shipping_info(tracking_number) WHERE tracking_number IS NOT NULL;

-- 4. Crear función para auto-asignar estado 'pendiente' cuando story se completa
CREATE OR REPLACE FUNCTION auto_assign_fulfillment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando cambia de draft a completed, asignar pendiente automáticamente
  IF OLD.status = 'draft' AND NEW.status = 'completed' THEN
    NEW.fulfillment_status = 'pendiente';
    
    -- También registrar en el historial
    INSERT INTO fulfillment_history (story_id, from_status, to_status, changed_by, notes)
    VALUES (NEW.id, NULL, 'pendiente', NEW.user_id, 'Pedido creado automáticamente al completar el cuento');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_auto_fulfillment ON stories;
CREATE TRIGGER trigger_auto_fulfillment
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_fulfillment_status();

-- 5. Crear función para registrar cambios de estado con historial
CREATE OR REPLACE FUNCTION update_fulfillment_status(
  p_story_id UUID,
  p_new_status VARCHAR(20),
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_status VARCHAR(20);
BEGIN
  -- Obtener estado actual
  SELECT fulfillment_status INTO v_current_status
  FROM stories
  WHERE id = p_story_id;
  
  -- Actualizar estado
  UPDATE stories
  SET fulfillment_status = p_new_status,
      updated_at = now()
  WHERE id = p_story_id;
  
  -- Registrar en historial
  INSERT INTO fulfillment_history (story_id, from_status, to_status, changed_by, notes)
  VALUES (p_story_id, v_current_status, p_new_status, p_user_id, p_notes);
END;
$$ LANGUAGE plpgsql;

-- 6. Crear índices para performance en consultas admin
CREATE INDEX IF NOT EXISTS idx_stories_fulfillment ON stories(status, fulfillment_status) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_stories_completed_at_fulfillment ON stories(completed_at DESC, fulfillment_status)
WHERE status = 'completed';

-- 7. Políticas RLS para tablas nuevas

-- Políticas para fulfillment_history
ALTER TABLE fulfillment_history ENABLE ROW LEVEL SECURITY;

-- Admins y operadores pueden ver todo el historial
CREATE POLICY "Admins and operators can view fulfillment history" ON fulfillment_history
  FOR SELECT
  TO authenticated
  USING (has_permission('orders.view'));

-- Admins y operadores pueden insertar historial
CREATE POLICY "Admins and operators can insert fulfillment history" ON fulfillment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (has_permission('orders.update'));

-- Políticas para shipping_info
ALTER TABLE shipping_info ENABLE ROW LEVEL SECURITY;

-- Admins y operadores pueden ver toda la información de envío
CREATE POLICY "Admins and operators can view shipping info" ON shipping_info
  FOR SELECT
  TO authenticated
  USING (has_permission('orders.view'));

-- Admins y operadores pueden gestionar información de envío
CREATE POLICY "Admins and operators can manage shipping info" ON shipping_info
  FOR ALL
  TO authenticated
  USING (has_permission('orders.update'))
  WITH CHECK (has_permission('orders.update'));

-- Usuarios pueden ver su propia información de envío
CREATE POLICY "Users can view own shipping info" ON shipping_info
  FOR SELECT
  TO authenticated
  USING (
    story_id IN (
      SELECT id FROM stories
      WHERE user_id = auth.uid()
    )
  );

-- 8. Crear vista para facilitar consultas de pedidos
CREATE OR REPLACE VIEW pedidos_view AS
SELECT 
  s.id,
  s.title,
  s.user_id,
  s.status,
  s.fulfillment_status,
  s.completed_at,
  s.created_at,
  s.updated_at,
  au.email as user_email,
  COALESCE(up.contact_person, split_part(au.email, '@', 1)) as user_name,
  up.shipping_phone,
  up.shipping_address,
  up.shipping_comuna,
  up.shipping_city,
  up.shipping_region,
  si.recipient_name,
  si.recipient_phone,
  si.city,
  si.region,
  si.tracking_number,
  si.courier,
  si.estimated_delivery,
  si.delivered_at,
  (
    SELECT json_agg(json_build_object(
      'from_status', fh.from_status,
      'to_status', fh.to_status,
      'changed_at', fh.created_at,
      'notes', fh.notes
    ) ORDER BY fh.created_at DESC)
    FROM fulfillment_history fh
    WHERE fh.story_id = s.id
  ) as history
FROM stories s
LEFT JOIN auth.users au ON s.user_id = au.id
LEFT JOIN user_profiles up ON s.user_id = up.user_id
LEFT JOIN shipping_info si ON s.id = si.story_id
WHERE s.status = 'completed';

-- Grant acceso a la vista para usuarios autenticados (RLS se aplica en las tablas base)
GRANT SELECT ON pedidos_view TO authenticated;

-- 9. Actualizar stories existentes que ya están completadas
UPDATE stories 
SET fulfillment_status = 'pendiente'
WHERE status = 'completed' AND fulfillment_status IS NULL;

-- Registrar en historial para stories ya completadas
INSERT INTO fulfillment_history (story_id, from_status, to_status, notes, created_at)
SELECT 
  id, 
  NULL, 
  'pendiente', 
  'Estado inicial asignado por migración',
  completed_at
FROM stories
WHERE status = 'completed' 
AND NOT EXISTS (
  SELECT 1 FROM fulfillment_history 
  WHERE story_id = stories.id
);