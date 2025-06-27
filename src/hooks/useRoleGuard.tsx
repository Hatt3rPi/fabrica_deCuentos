import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole, UserRole } from '../context/UserRoleContext';

export interface RoleGuardOptions {
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  redirectTo?: string;
  fallbackComponent?: React.ComponentType;
  onAccessDenied?: () => void;
  requireAll?: boolean; // Si true, requiere TODOS los roles/permisos. Si false, requiere AL MENOS UNO
}

export interface RoleGuardResult {
  isAuthorized: boolean;
  isLoading: boolean;
  missingRoles: UserRole[];
  missingPermissions: string[];
  primaryRole: UserRole | null;
}

/**
 * Hook para proteger componentes basado en roles y permisos
 * 
 * @param options Configuración del guard de roles
 * @returns Resultado de la verificación de autorización
 * 
 * @example
 * // Proteger una página solo para admins
 * const { isAuthorized, isLoading } = useRoleGuard({
 *   requiredRoles: ['admin'],
 *   redirectTo: '/unauthorized'
 * });
 * 
 * @example
 * // Verificar permisos específicos
 * const { isAuthorized } = useRoleGuard({
 *   requiredPermissions: ['orders.view', 'orders.update'],
 *   requireAll: false // Requiere al menos uno
 * });
 * 
 * @example
 * // Múltiples roles con callback personalizado
 * const { isAuthorized } = useRoleGuard({
 *   requiredRoles: ['admin', 'operator'],
 *   onAccessDenied: () => showToast('No tienes permisos para acceder')
 * });
 */
export const useRoleGuard = (options: RoleGuardOptions = {}): RoleGuardResult => {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    redirectTo,
    onAccessDenied,
    requireAll = false
  } = options;

  const navigate = useNavigate();
  const { 
    hasRole, 
    hasAnyRole, 
    hasPermission, 
    primaryRole, 
    isLoading,
    roles 
  } = useUserRole();

  // Verificar roles requeridos
  const checkRoles = (): { authorized: boolean; missing: UserRole[] } => {
    if (requiredRoles.length === 0) {
      return { authorized: true, missing: [] };
    }

    if (requireAll) {
      // Requiere TODOS los roles
      const missing = requiredRoles.filter(role => !hasRole(role));
      return {
        authorized: missing.length === 0,
        missing
      };
    } else {
      // Requiere AL MENOS UN rol
      const hasAnyRequired = hasAnyRole(requiredRoles);
      return {
        authorized: hasAnyRequired,
        missing: hasAnyRequired ? [] : requiredRoles
      };
    }
  };

  // Verificar permisos requeridos
  const checkPermissions = (): { authorized: boolean; missing: string[] } => {
    if (requiredPermissions.length === 0) {
      return { authorized: true, missing: [] };
    }

    if (requireAll) {
      // Requiere TODOS los permisos
      const missing = requiredPermissions.filter(permission => !hasPermission(permission));
      return {
        authorized: missing.length === 0,
        missing
      };
    } else {
      // Requiere AL MENOS UN permiso
      const hasAnyRequired = requiredPermissions.some(permission => hasPermission(permission));
      return {
        authorized: hasAnyRequired,
        missing: hasAnyRequired ? [] : requiredPermissions
      };
    }
  };

  // Realizar verificaciones
  const roleCheck = checkRoles();
  const permissionCheck = checkPermissions();

  // Determinar autorización final
  const isAuthorized = roleCheck.authorized && permissionCheck.authorized;

  // Manejar acceso denegado
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      // Ejecutar callback personalizado si existe
      if (onAccessDenied) {
        onAccessDenied();
      }

      // Redirigir si se especificó una ruta
      if (redirectTo) {
        navigate(redirectTo, { 
          replace: true,
          state: { 
            reason: 'access_denied',
            missingRoles: roleCheck.missing,
            missingPermissions: permissionCheck.missing,
            userRole: primaryRole
          }
        });
      }
    }
  }, [isLoading, isAuthorized, onAccessDenied, redirectTo, navigate, roleCheck.missing, permissionCheck.missing, primaryRole]);

  return {
    isAuthorized,
    isLoading,
    missingRoles: roleCheck.missing,
    missingPermissions: permissionCheck.missing,
    primaryRole
  };
};

/**
 * Componente HOC para proteger rutas completas
 * 
 * @example
 * export default withRoleGuard(AdminPedidos, {
 *   requiredPermissions: ['orders.view'],
 *   redirectTo: '/unauthorized'
 * });
 */
export const withRoleGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: RoleGuardOptions
) => {
  return (props: P) => {
    const { isAuthorized, isLoading } = useRoleGuard(options);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (!isAuthorized) {
      if (options.fallbackComponent) {
        const FallbackComponent = options.fallbackComponent;
        return <FallbackComponent />;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-7V9m0 0V7m0 2h2m-2 0H8" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta página.</p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

/**
 * Hook para verificaciones condicionales de roles (no redirige)
 * Útil para mostrar/ocultar elementos basado en permisos
 * 
 * @example
 * const canEdit = useRoleCheck(['admin', 'operator']);
 * return (
 *   <div>
 *     <h1>Lista de pedidos</h1>
 *     {canEdit && <button>Editar</button>}
 *   </div>
 * );
 */
export const useRoleCheck = (
  requiredRoles: UserRole[] = [],
  requiredPermissions: string[] = [],
  requireAll: boolean = false
): boolean => {
  const { isAuthorized } = useRoleGuard({
    requiredRoles,
    requiredPermissions,
    requireAll
  });
  
  return isAuthorized;
};