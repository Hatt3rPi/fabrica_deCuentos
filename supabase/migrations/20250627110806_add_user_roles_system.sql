-- Sistema robusto de roles para reemplazar emails hardcodeados
-- Soporta admin, operator, user con permisos granulares y auditoría

-- 1. Crear tabla de roles de usuario
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'user')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Para roles temporales
  is_active BOOLEAN DEFAULT true,
  notes TEXT, -- Notas sobre por qué se asignó el rol
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Un usuario puede tener múltiples roles, pero no duplicados activos
  UNIQUE(user_id, role, is_active)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL AND is_active = true;

-- 2. Crear tabla de historial de cambios de roles (auditoría)
CREATE TABLE IF NOT EXISTS user_role_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'expired')),
  previous_state JSONB, -- Estado anterior del rol
  new_state JSONB, -- Nuevo estado del rol
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT, -- Razón del cambio
  ip_address INET, -- IP desde donde se hizo el cambio
  user_agent TEXT -- User agent del navegador
);

-- Índice para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_user_role_history_user_id ON user_role_history(user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_role_history_changed_by ON user_role_history(changed_by, changed_at DESC);

-- 3. Función para verificar si un usuario tiene un rol específico
CREATE OR REPLACE FUNCTION has_role(check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = check_role 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para verificar si un usuario tiene cualquiera de múltiples roles
CREATE OR REPLACE FUNCTION has_any_role(check_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(check_roles)
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para obtener roles de un usuario (para el frontend)
CREATE OR REPLACE FUNCTION get_user_roles(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(role TEXT, granted_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE, notes TEXT) AS $$
BEGIN
  -- Si no se especifica usuario, usar el actual
  IF target_user_id IS NULL THEN
    target_user_id := auth.uid();
  END IF;
  
  -- Solo admins pueden ver roles de otros usuarios
  IF target_user_id != auth.uid() AND NOT has_role('admin') THEN
    RAISE EXCEPTION 'No tienes permisos para ver roles de otros usuarios';
  END IF;
  
  RETURN QUERY
  SELECT ur.role, ur.granted_at, ur.expires_at, ur.notes
  FROM user_roles ur
  WHERE ur.user_id = target_user_id 
  AND ur.is_active = true 
  AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ORDER BY ur.granted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para asignar rol (solo admins)
CREATE OR REPLACE FUNCTION assign_role(
  target_user_id UUID,
  new_role TEXT,
  expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  notes_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  granter_id UUID;
BEGIN
  -- Solo admins pueden asignar roles
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden asignar roles';
  END IF;
  
  -- Verificar que el rol sea válido
  IF new_role NOT IN ('admin', 'operator', 'user') THEN
    RAISE EXCEPTION 'Rol inválido: %', new_role;
  END IF;
  
  granter_id := auth.uid();
  
  -- Insertar nuevo rol (ON CONFLICT manejará duplicados)
  INSERT INTO user_roles (user_id, role, granted_by, expires_at, notes)
  VALUES (target_user_id, new_role, granter_id, expires_at_param, notes_param)
  ON CONFLICT (user_id, role, is_active) 
  DO UPDATE SET 
    granted_by = granter_id,
    granted_at = now(),
    expires_at = expires_at_param,
    notes = notes_param,
    updated_at = now();
  
  -- Registrar en historial
  INSERT INTO user_role_history (user_id, role, action, new_state, changed_by, reason)
  VALUES (
    target_user_id, 
    new_role, 
    'granted',
    jsonb_build_object(
      'expires_at', expires_at_param,
      'notes', notes_param,
      'granted_by', granter_id
    ),
    granter_id,
    COALESCE(notes_param, 'Rol asignado por administrador')
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para revocar rol (solo admins)
CREATE OR REPLACE FUNCTION revoke_role(
  target_user_id UUID,
  role_to_revoke TEXT,
  reason_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  revoker_id UUID;
  previous_state JSONB;
BEGIN
  -- Solo admins pueden revocar roles
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden revocar roles';
  END IF;
  
  revoker_id := auth.uid();
  
  -- Obtener estado anterior para auditoría
  SELECT jsonb_build_object(
    'granted_at', granted_at,
    'expires_at', expires_at,
    'notes', notes,
    'granted_by', granted_by
  ) INTO previous_state
  FROM user_roles
  WHERE user_id = target_user_id AND role = role_to_revoke AND is_active = true;
  
  -- Marcar rol como inactivo
  UPDATE user_roles 
  SET is_active = false, updated_at = now()
  WHERE user_id = target_user_id AND role = role_to_revoke AND is_active = true;
  
  -- Registrar en historial
  INSERT INTO user_role_history (user_id, role, action, previous_state, changed_by, reason)
  VALUES (
    target_user_id, 
    role_to_revoke, 
    'revoked',
    previous_state,
    revoker_id,
    COALESCE(reason_param, 'Rol revocado por administrador')
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para limpiar roles expirados (cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_roles()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Marcar roles expirados como inactivos
  UPDATE user_roles 
  SET is_active = false, updated_at = now()
  WHERE expires_at <= now() AND is_active = true;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Registrar en historial los roles expirados
  INSERT INTO user_role_history (user_id, role, action, reason)
  SELECT user_id, role, 'expired', 'Rol expirado automáticamente'
  FROM user_roles
  WHERE expires_at <= now() AND is_active = false AND updated_at >= now() - INTERVAL '1 minute';
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- 10. Políticas RLS para las nuevas tablas

-- Tabla user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propios roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins pueden ver todos los roles
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (has_role('admin'));

-- Solo admins pueden insertar/actualizar/eliminar roles
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- Tabla user_role_history
ALTER TABLE user_role_history ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver su propio historial
CREATE POLICY "Users can view own role history" ON user_role_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins pueden ver todo el historial
CREATE POLICY "Admins can view all role history" ON user_role_history
  FOR SELECT
  TO authenticated
  USING (has_role('admin'));

-- Solo admins pueden insertar en historial (las funciones lo hacen automáticamente)
CREATE POLICY "Admins can insert role history" ON user_role_history
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

-- 11. Migrar usuarios hardcodeados actuales a roles admin
-- Crear función temporal para migración
CREATE OR REPLACE FUNCTION migrate_hardcoded_admins()
RETURNS INTEGER AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'fabarca212@gmail.com',
    'lucianoalonso2000@gmail.com', 
    'javier2000asr@gmail.com'
  ];
  email_item TEXT;
  user_uuid UUID;
  migrated_count INTEGER := 0;
BEGIN
  FOREACH email_item IN ARRAY admin_emails
  LOOP
    -- Buscar el UUID del usuario por email
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = email_item;
    
    IF user_uuid IS NOT NULL THEN
      -- Asignar rol admin si no existe
      INSERT INTO user_roles (user_id, role, granted_by, notes, granted_at)
      VALUES (
        user_uuid, 
        'admin', 
        user_uuid, -- Se auto-asigna en la migración
        'Migrado automáticamente desde emails hardcodeados',
        now()
      )
      ON CONFLICT (user_id, role, is_active) DO NOTHING;
      
      -- Incrementar contador si se insertó
      IF FOUND THEN
        migrated_count := migrated_count + 1;
      END IF;
      
      -- Registrar en historial
      INSERT INTO user_role_history (user_id, role, action, reason, changed_by)
      VALUES (
        user_uuid,
        'admin',
        'granted',
        'Migración automática desde sistema hardcodeado',
        user_uuid
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migración
SELECT migrate_hardcoded_admins();

-- Limpiar función temporal
DROP FUNCTION migrate_hardcoded_admins();

-- 12. Crear vista para facilitar consultas de usuarios con roles
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  COALESCE(
    json_agg(
      json_build_object(
        'role', ur.role,
        'granted_at', ur.granted_at,
        'expires_at', ur.expires_at,
        'notes', ur.notes
      ) ORDER BY ur.granted_at DESC
    ) FILTER (WHERE ur.role IS NOT NULL),
    '[]'::json
  ) as roles,
  -- Roles activos como array simple
  COALESCE(
    array_agg(ur.role ORDER BY ur.granted_at DESC) FILTER (WHERE ur.role IS NOT NULL),
    ARRAY[]::TEXT[]
  ) as active_roles,
  -- Flags de conveniencia
  bool_or(ur.role = 'admin') as is_admin,
  bool_or(ur.role = 'operator') as is_operator,
  bool_or(ur.role = 'user') as is_user
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id 
  AND ur.is_active = true 
  AND (ur.expires_at IS NULL OR ur.expires_at > now())
GROUP BY u.id, u.email, u.created_at;

-- Grant acceso a la vista para usuarios autenticados (RLS se aplica en tablas base)
GRANT SELECT ON users_with_roles TO authenticated;

-- 13. Función de utilidad para verificar permisos específicos
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
    
    ELSE
      -- Por defecto, permisos desconocidos requieren admin
      RETURN has_role('admin');
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Comentarios para documentación
COMMENT ON TABLE user_roles IS 'Sistema de roles de usuario: admin, operator, user con soporte para roles temporales';
COMMENT ON TABLE user_role_history IS 'Auditoría completa de cambios de roles para compliance y seguridad';
COMMENT ON FUNCTION has_role(TEXT) IS 'Verifica si el usuario actual tiene un rol específico';
COMMENT ON FUNCTION has_any_role(TEXT[]) IS 'Verifica si el usuario actual tiene cualquiera de los roles especificados';
COMMENT ON FUNCTION has_permission(TEXT) IS 'Sistema de permisos granulares basado en roles';
COMMENT ON VIEW users_with_roles IS 'Vista desnormalizada de usuarios con sus roles para consultas eficientes';