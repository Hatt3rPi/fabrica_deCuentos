-- Agregar permiso products.manage a la función has_permission
-- Necesario para que las políticas RLS del sistema de precios funcionen correctamente

CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Sistema de permisos basado en roles
  CASE permission_name
    -- Gestión de pedidos
    WHEN 'orders.view' THEN
      RETURN has_any_role(ARRAY['admin', 'operator']);
    WHEN 'orders.update' THEN
      RETURN has_any_role(ARRAY['admin', 'operator']);
    WHEN 'orders.export' THEN
      RETURN has_any_role(ARRAY['admin', 'operator']);
    WHEN 'orders.manage' THEN
      RETURN has_role('admin');
    
    -- Configuración del sistema
    WHEN 'config.admin' THEN
      RETURN has_role('admin');
    WHEN 'config.styles' THEN
      RETURN has_role('admin');
    WHEN 'config.prompts' THEN
      RETURN has_role('admin');
    
    -- Analytics
    WHEN 'analytics.full' THEN
      RETURN has_role('admin');
    WHEN 'analytics.operational' THEN
      RETURN has_any_role(ARRAY['admin', 'operator']);
    
    -- Gestión de usuarios
    WHEN 'users.manage' THEN
      RETURN has_role('admin');
    WHEN 'roles.assign' THEN
      RETURN has_role('admin');
    
    -- Flujo de trabajo
    WHEN 'workflow.admin' THEN
      RETURN has_role('admin');
    
    -- Gestión de productos y precios (NUEVO)
    WHEN 'products.manage' THEN
      RETURN has_role('admin');
    
    ELSE
      -- Por defecto, permisos desconocidos requieren admin
      RETURN has_role('admin');
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar comentario de la función
COMMENT ON FUNCTION has_permission(TEXT) IS 'Sistema de permisos granulares basado en roles - incluye products.manage para sistema de precios';