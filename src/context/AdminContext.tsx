import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const ADMIN_EMAILS = [
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
];

const AdminContext = createContext<boolean>(false);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_EMAILS.includes(user.email ?? '');
  return <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => useContext(AdminContext);
