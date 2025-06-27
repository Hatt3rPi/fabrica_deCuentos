-- Actualizar vista pedidos_view para incluir export_url
-- La vista original no incluía este campo crucial para mostrar el botón Ver PDF

-- Primero, eliminar la vista existente
DROP VIEW IF EXISTS pedidos_view;

-- Recrear la vista con export_url incluido
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
  s.export_url,  -- Campo crítico que faltaba
  s.exported_at, -- También agregar fecha de exportación
  au.email as user_email,
  COALESCE(up.contact_person, split_part(au.email, '@', 1)) as user_name,
  up.shipping_phone,
  up.shipping_address,
  up.shipping_comuna,
  up.shipping_city,
  up.shipping_region,
  si.recipient_name,
  si.recipient_phone,
  si.address_line1,
  si.address_line2,
  si.city,
  si.region,
  si.postal_code,
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

-- Grant acceso a la vista para usuarios autenticados
GRANT SELECT ON pedidos_view TO authenticated;

-- Verificar que la vista ahora incluye export_url
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'pedidos_view' 
    AND column_name = 'export_url'
  ) THEN
    RAISE NOTICE '✅ Vista pedidos_view actualizada exitosamente con campo export_url';
  ELSE
    RAISE EXCEPTION '❌ Error: Campo export_url no se agregó a la vista';
  END IF;
END $$;