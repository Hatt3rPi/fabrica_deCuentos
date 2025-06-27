# Sistema de Roles de Usuario

Documentación técnica del sistema robusto de roles que reemplaza los emails hardcodeados por un sistema escalable y mantenible.

## Resumen

El sistema de roles permite gestionar permisos de usuario a través de roles asignables (`admin`, `operator`, `user`) con funcionalidades de auditoría, roles temporales y permisos granulares.

## Problema Anterior

- **Emails hardcodeados** en múltiples archivos y migraciones
- **No escalable** - agregar/remover admins requería modificar código
- **Sin auditoría** - no había registro de cambios de permisos
- **Sin granularidad** - solo admin vs. no admin
- **Mantenimiento complejo** - cambios dispersos en múltiples lugares

## Arquitectura del Sistema

### Estructura de Roles

```
ADMIN (Súper usuario)
├── Acceso total al sistema
├── Gestión de usuarios y roles
├── Configuración global  
├── Analytics completos
└── Todas las funcionalidades

OPERATOR (Operador)
├── Gestión de pedidos (fulfillment)
├── Ver métricas operacionales
├── Gestión de envíos
└── Sin acceso a configuración

USER (Usuario final)
├── Crear y gestionar sus cuentos
├── Ver su historial
└── Gestionar su perfil
```

### Base de Datos

#### Tabla `user_roles`

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'user')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Para roles temporales
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Características:**
- **Roles múltiples**: Un usuario puede tener varios roles simultáneamente
- **Roles temporales**: Campo `expires_at` para roles con fecha de vencimiento
- **Auditoría**: Tracking de quién asignó el rol y cuándo
- **Notas**: Campo para documentar por qué se asignó un rol

#### Tabla `user_role_history`

```sql
CREATE TABLE user_role_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'expired')),
  previous_state JSONB,
  new_state JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT,
  ip_address INET,
  user_agent TEXT
);
```

**Funciones de auditoría:**
- **Registro completo** de todos los cambios de roles
- **Estado anterior y nuevo** en formato JSON
- **Metadatos de contexto** (IP, user agent)
- **Razones documentadas** para cambios

### Funciones RPC

#### `has_role(check_role TEXT)`

Verifica si el usuario actual tiene un rol específico:

```sql
SELECT has_role('admin'); -- true/false
```

#### `has_any_role(check_roles TEXT[])`

Verifica si el usuario tiene cualquiera de los roles especificados:

```sql
SELECT has_any_role(ARRAY['admin', 'operator']); -- true/false
```

#### `has_permission(permission_name TEXT)`

Sistema de permisos granulares basado en funcionalidades:

```sql
SELECT has_permission('orders.view'); -- true/false
```

#### `assign_role(target_user_id, new_role, expires_at, notes)`

Asigna un rol a un usuario (solo admins):

```sql
SELECT assign_role(
  'user-uuid-here',
  'operator',
  '2025-12-31 23:59:59'::timestamp,
  'Operador temporal para temporada navideña'
);
```

#### `revoke_role(target_user_id, role_to_revoke, reason)`

Revoca un rol específico (solo admins):

```sql
SELECT revoke_role(
  'user-uuid-here',
  'operator',
  'Fin del periodo temporal'
);
```

### Vista `users_with_roles`

Vista desnormalizada para consultas eficientes:

```sql
SELECT 
  email,
  active_roles,
  is_admin,
  is_operator,
  roles -- JSON con detalles completos
FROM users_with_roles;
```

## Sistema de Permisos

### Permisos Definidos

```typescript
const PERMISSIONS = {
  // Gestión de pedidos
  'orders.view': ['admin', 'operator'],
  'orders.update': ['admin', 'operator'], 
  'orders.export': ['admin', 'operator'],
  
  // Configuración
  'config.admin': ['admin'],
  'config.styles': ['admin'],
  'config.prompts': ['admin'],
  
  // Analytics
  'analytics.full': ['admin'],
  'analytics.operational': ['admin', 'operator'],
  
  // Usuarios
  'users.manage': ['admin'],
  'roles.assign': ['admin'],
  
  // Flujo de trabajo
  'workflow.admin': ['admin']
};
```

### Verificación en Base de Datos

La función `has_permission()` centraliza la lógica de permisos:

```sql
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  CASE permission_name
    WHEN 'orders.view' THEN
      RETURN has_any_role(ARRAY['admin', 'operator']);
    WHEN 'config.admin' THEN
      RETURN has_role('admin');
    -- ... más casos
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Frontend: Sistema de Contextos

### UserRoleContext

Contexto principal que maneja el estado de roles:

```typescript
interface UserRoleContextType {
  roles: RoleInfo[];
  primaryRole: UserRole | null;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isUser: boolean;
}
```

**Características:**
- **Carga automática** de roles al cambiar usuario
- **Rol primario** calculado por prioridad
- **Verificaciones rápidas** con métodos helper
- **Estado de carga** para UI responsiva

### Hook useRoleGuard

Hook para protección de componentes y rutas:

```typescript
const { isAuthorized, isLoading } = useRoleGuard({
  requiredPermissions: ['orders.view'],
  redirectTo: '/unauthorized'
});
```

**Opciones disponibles:**
- `requiredRoles`: Array de roles requeridos
- `requiredPermissions`: Array de permisos requeridos
- `requireAll`: Si requiere todos o al menos uno
- `redirectTo`: Ruta de redirección si no autorizado
- `onAccessDenied`: Callback personalizado

### Hook useRoleCheck

Hook simple para verificaciones condicionales:

```typescript
const canEdit = useRoleCheck(['admin', 'operator']);
const canManageUsers = useRoleCheck([], ['users.manage']);

return (
  <div>
    {canEdit && <button>Editar</button>}
    {canManageUsers && <Link to="/admin/users">Usuarios</Link>}
  </div>
);
```

## Migración del Sistema Anterior

### Migración Automática

La migración incluye conversión automática de emails hardcodeados:

```sql
-- Usuarios migrados automáticamente:
-- fabarca212@gmail.com → admin
-- lucianoalonso2000@gmail.com → admin  
-- javier2000asr@gmail.com → admin
```

### Compatibilidad Temporal

El `AdminContext` mantiene retrocompatibilidad:

```typescript
export const AdminProvider = ({ children }) => {
  try {
    // Intentar usar sistema de roles
    const { isAdmin: isAdminByRole } = useUserRole();
    
    // Fallback a hardcoded si no disponible
    const isAdminHardcoded = ADMIN_EMAILS.includes(user.email);
    
    const isAdmin = isAdminByRole || isAdminHardcoded;
    
    return <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>;
  } catch {
    // Fallback completo a sistema anterior
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    return <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>;
  }
};
```

### Actualización de Políticas RLS

Todas las políticas se actualizaron de:

```sql
-- Antes (hardcodeado)
auth.jwt() ->> 'email' = ANY(ARRAY['fabarca212@gmail.com', ...])

-- Después (basado en roles)
has_permission('orders.view')
```

## Gestión de Usuarios

### Página AdminUsers

Interfaz completa para gestión de roles:

**Funcionalidades:**
- **Lista de usuarios** con roles activos
- **Asignación de roles** con notas y fechas de expiración
- **Revocación inmediata** de roles
- **Validaciones de seguridad** para cambios críticos

**Flujo de asignación:**
1. Admin selecciona usuario
2. Elige rol (user/operator/admin)
3. Opcionalmente añade fecha de expiración y notas
4. Sistema registra cambio con auditoría completa

### Seguridad

**Validaciones implementadas:**
- Solo admins pueden asignar/revocar roles
- Confirmaciones para cambios críticos
- Advertencias para rol admin
- Registro completo de auditoría
- Rates limits en funciones RPC

## Performance y Optimización

### Índices de Base de Datos

```sql
-- Índices para queries frecuentes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id) WHERE is_active = true;
CREATE INDEX idx_user_roles_role ON user_roles(role) WHERE is_active = true;
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;
```

### Funciones Optimizadas

- **SECURITY DEFINER**: Funciones ejecutan con privilegios del propietario
- **Consultas eficientes**: Uso de índices y WHERE clauses optimizadas
- **Vista materializada**: `users_with_roles` para joins complejos

### Frontend

- **Context caching**: Roles se cargan una vez por sesión
- **Verificaciones locales**: Métodos helper para checks rápidos
- **Lazy loading**: Componentes protegidos se cargan solo si autorizados

## Mantenimiento y Operaciones

### Limpieza Automática

Función para limpiar roles expirados:

```sql
SELECT cleanup_expired_roles(); -- Retorna cantidad de roles expirados
```

Recomendado ejecutar como cron job diario.

### Auditoría y Compliance

**Consultas útiles:**

```sql
-- Ver historial de cambios de un usuario
SELECT * FROM user_role_history 
WHERE user_id = 'uuid' 
ORDER BY changed_at DESC;

-- Usuarios con roles críticos
SELECT email, active_roles 
FROM users_with_roles 
WHERE is_admin = true;

-- Cambios recientes de roles
SELECT * FROM user_role_history 
WHERE changed_at > now() - INTERVAL '7 days'
ORDER BY changed_at DESC;
```

### Monitoreo

**Métricas recomendadas:**
- Cantidad de usuarios por rol
- Frecuencia de cambios de roles
- Roles próximos a expirar
- Intentos de acceso no autorizado

## Troubleshooting

### Problemas Comunes

1. **Usuario sin acceso después de migración**
   - Verificar que el email esté en la lista de migración
   - Ejecutar manualmente: `SELECT assign_role('user-id', 'admin')`

2. **Funciones RPC no funcionan**
   - Verificar que el usuario esté autenticado
   - Confirmar que las funciones tengan SECURITY DEFINER

3. **Context no carga roles**
   - Verificar que UserRoleProvider esté en App.tsx
   - Revisar logs de la función get_user_roles

### Comandos de Diagnóstico

```sql
-- Verificar roles de usuario actual
SELECT * FROM get_user_roles();

-- Verificar función de permisos
SELECT has_permission('orders.view');

-- Verificar políticas RLS
SELECT tablename, policyname, permissive 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename LIKE '%role%';
```

## Roadmap Futuro

### Mejoras Planificadas

1. **Roles jerárquicos**: Herencia de permisos
2. **Grupos de usuarios**: Asignación masiva de roles
3. **API externa**: Gestión de roles vía API
4. **Integraciones SSO**: LDAP, SAML, etc.
5. **Dashboard de auditoría**: Interfaz visual para compliance

### Consideraciones de Escalabilidad

- **Sharding**: Para millones de usuarios
- **Cache distribuido**: Redis para roles frecuentes
- **Rate limiting**: Para prevenir abuse
- **Backup strategy**: Para datos críticos de auditoría