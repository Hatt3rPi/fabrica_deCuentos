import React from 'react';
import { BookOpen, User, Settings, LogOut, AlertTriangle, BarChart3, Home, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();
  const isAdmin = useAdmin();



  return (
    <div className="h-full w-64 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      {/* Logo section */}
      <div className="h-[81px] flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-gray-900 dark:text-white">CuenterIA</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          <li>
            <Link to="/home" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
              <Home className="w-5 h-5" />
              <span>Mis Cuentos</span>
            </Link>
          </li>
          <li>
            <Link to="/perfil" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link to="/admin/prompts" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
                <Settings className="w-5 h-5" />
                <span>Prompts</span>
              </Link>
            </li>
          )}
          {isAdmin && (
            <>
              <li>
                <Link
                  to="/admin/analytics"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Analytics</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/flujo"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Flujo</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/style"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                >
                  <Palette className="w-5 h-5" />
                  <span>Estilos</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Footer actions - Fixed at bottom */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
