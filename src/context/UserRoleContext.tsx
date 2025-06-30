import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'operator' | 'user';

export interface RoleInfo {
  role: UserRole;
  granted_at: string;
  expires_at?: string;
  notes?: string;
}

export interface UserRoleContextType {
  roles: RoleInfo[];
  primaryRole: UserRole | null;
  isLoading: boolean;
  error: string | null;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshRoles: () => Promise<void>;
  // Flags de conveniencia
  isAdmin: boolean;
  isOperator: boolean;
  isUser: boolean;
}

// Definición de permisos por rol
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    // Gestión de pedidos
    'orders.view', 'orders.update', 'orders.export',
    // Configuración
    'config.admin', 'config.styles', 'config.prompts',
    // Analytics
    'analytics.full', 'analytics.operational',
    // Gestión de usuarios
    'users.manage', 'roles.assign',
    // Flujo de trabajo
    'workflow.admin',
    // Gestión de productos y precios
    'products.manage'
  ],
  operator: [
    // Gestión de pedidos
    'orders.view', 'orders.update', 'orders.export',
    // Analytics operacionales
    'analytics.operational'
  ],
  user: [
    // Solo permisos básicos de usuario
    'stories.own'
  ]
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar roles del usuario
  const loadUserRoles = async () => {
    if (!user) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: roleError } = await supabase.rpc('get_user_roles');
      
      if (roleError) {
        throw roleError;
      }

      setRoles(data || []);
    } catch (err) {
      console.error('Error loading user roles:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar roles al cambiar usuario
  useEffect(() => {
    loadUserRoles();
  }, [user]);

  // Rol primario (el más reciente y con mayor privilegio)
  const primaryRole: UserRole | null = React.useMemo(() => {
    if (roles.length === 0) return null;
    
    // Prioridad: admin > operator > user
    const rolePriority: Record<UserRole, number> = {
      admin: 3,
      operator: 2,
      user: 1
    };

    const sortedRoles = [...roles].sort((a, b) => {
      const priorityDiff = rolePriority[b.role] - rolePriority[a.role];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Si tienen la misma prioridad, ordenar por fecha
      return new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime();
    });

    return sortedRoles[0]?.role || null;
  }, [roles]);

  // Verificar si tiene un rol específico
  const hasRole = (role: UserRole): boolean => {
    return roles.some(r => r.role === role);
  };

  // Verificar si tiene cualquiera de los roles especificados
  const hasAnyRole = (checkRoles: UserRole[]): boolean => {
    return roles.some(r => checkRoles.includes(r.role));
  };

  // Verificar permiso específico
  const hasPermission = (permission: string): boolean => {
    if (!primaryRole) return false;
    
    // Buscar en todos los roles del usuario
    for (const roleInfo of roles) {
      const rolePermissions = ROLE_PERMISSIONS[roleInfo.role] || [];
      if (rolePermissions.includes(permission)) {
        return true;
      }
    }
    
    return false;
  };

  // Flags de conveniencia
  const isAdmin = hasRole('admin');
  const isOperator = hasRole('operator');
  const isUser = hasRole('user');

  const contextValue: UserRoleContextType = {
    roles,
    primaryRole,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    hasPermission,
    refreshRoles: loadUserRoles,
    isAdmin,
    isOperator,
    isUser
  };

  return (
    <UserRoleContext.Provider value={contextValue}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole debe usarse dentro de un UserRoleProvider');
  }
  return context;
};

// Hook de conveniencia para verificar roles específicos
export const useRoleCheck = () => {
  const { hasRole, hasAnyRole, hasPermission, isAdmin, isOperator, isUser } = useUserRole();
  
  return {
    hasRole,
    hasAnyRole,
    hasPermission,
    isAdmin,
    isOperator,
    isUser,
    // Verificaciones comunes
    canManageOrders: () => hasPermission('orders.view'),
    canUpdateOrders: () => hasPermission('orders.update'),
    canManageUsers: () => hasPermission('users.manage'),
    canViewAnalytics: () => hasPermission('analytics.operational'),
    canManageConfig: () => hasPermission('config.admin')
  };
};