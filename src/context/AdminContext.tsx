import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useUserRole } from './UserRoleContext';

// DEPRECATED: Emails hardcodeados mantenidos para compatibilidad temporal
// TODO: Remover después de migrar todos los componentes al nuevo sistema de roles
const ADMIN_EMAILS = [
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
];

const AdminContext = createContext<boolean>(false);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  try {
    // Intentar usar el nuevo sistema de roles
    const { isAdmin: isAdminByRole } = useUserRole();
    
    // Fallback a sistema hardcodeado si hay error o no hay roles cargados
    const isAdminHardcoded = !!user && ADMIN_EMAILS.includes(user.email ?? '');
    
    // Usar sistema de roles si está disponible, sino fallback a hardcoded
    const isAdmin = isAdminByRole || isAdminHardcoded;
    
    return <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>;
  } catch {
    // Si UserRoleContext no está disponible, usar sistema hardcodeado
    const isAdmin = !!user && ADMIN_EMAILS.includes(user.email ?? '');
    return <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>;
  }
};

/**
 * @deprecated Use useUserRole().isAdmin o useRoleCheck() instead
 * Este hook se mantiene para compatibilidad temporal con componentes existentes
 */
export const useAdmin = () => {
  console.warn('useAdmin() is deprecated. Use useUserRole().isAdmin or useRoleCheck() instead');
  return useContext(AdminContext);
};
