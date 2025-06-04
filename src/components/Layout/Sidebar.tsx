import React from 'react';
import { BookOpen, User, LogOut, AlertTriangle, BarChart3, Home, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isMobile?: boolean;
  isMenuOpen?: boolean;
  onNavigation?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onNavigation, isMenuOpen = true }) => {
  const { signOut } = useAuth();
  const isAdmin = useAdmin();
  const location = useLocation();

  const handleNavigation = () => {
    if (onNavigation) onNavigation();
  };

  const handleSignOut = () => {
    signOut();
    if (onNavigation) onNavigation();
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Inicio', exact: true },
    { to: '/home', icon: BookOpen, label: 'Cuentos', exact: false },
    { to: '/perfil', icon: User, label: 'Mi Perfil', exact: false },
    ...(isAdmin ? [{ to: '/admin/prompts', icon: AlertTriangle, label: 'Administrar', exact: false }] : []),
    ...(isAdmin ? [{ to: '/admin/analytics', icon: BarChart3, label: 'Analíticas', exact: false }] : []),
  ];

  return (
    <div 
      className={`
        h-full flex-shrink-0 flex flex-col
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-800
        overflow-y-auto transition-all duration-300
        ${isMobile ? 'fixed left-0 top-0 z-40 w-64' : 'relative'}
        ${!isMenuOpen && isMobile ? 'hidden' : 'block'}
        ${!isMobile && !isMenuOpen ? 'w-16' : 'w-64'}
      `}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent',
        height: isMobile ? '100vh' : '100%'
      }}
    >
      {/* Logo Section */}
      <div className="sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            {isMenuOpen && (
              <div className="overflow-hidden">
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
                  CuenterIA
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Crea tus historias</p>
              </div>
            )}
          </div>
          {(isMobile || !isMenuOpen) && (
            <button 
              onClick={onNavigation}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={handleNavigation}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 dark:bg-gray-800 dark:text-purple-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/50'
                    }

                  `}
                >
                  <span className={`p-1.5 rounded-lg ${
                    isActive 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    <item.icon className="w-4 h-4" />
                  </span>
                  {isMenuOpen && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="mt-auto p-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleSignOut}
          className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${!isMenuOpen ? 'justify-center' : ''}`}
          title={!isMenuOpen ? 'Cerrar sesión' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isMenuOpen && <span>Cerrar sesión</span>}
        </button>
        {isMenuOpen && (
          <div className="mt-2 text-center">
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {isAdmin ? 'Administrador' : 'Usuario'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
