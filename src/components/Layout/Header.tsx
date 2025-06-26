import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Menu, X, User, Home, Settings, LogOut, AlertTriangle, BarChart3, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import NotificationBell from '../Notifications/NotificationBell';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const isAdmin = useAdmin();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Cerrar el menú al cambiar de ruta
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // Set header height CSS variable for notification positioning
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };

    // Initial update
    updateHeaderHeight();

    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);
    
    // Force an update after a short delay to ensure all elements are rendered
    const timeoutId = setTimeout(updateHeaderHeight, 100);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <header ref={headerRef} className="bg-white shadow-md py-4 px-4 md:px-6 dark:bg-gray-800 dark:text-white">
      <div className="flex items-center justify-between">
        {/* Mobile menu button - Only visible on mobile */}
        <button 
          className="lg:hidden p-2 hover:bg-purple-50 rounded-lg dark:hover:bg-purple-900/20"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          ) : (
            <Menu className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          )}
        </button>

        {/* Logo and title */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            La CuenterIA
          </h1>
        </div>

        {/* User info and notifications */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="hidden md:inline text-sm font-medium text-gray-500 dark:text-gray-300">
            {user?.email}
          </span>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <nav>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/home" 
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                  onClick={closeMobileMenu}
                >
                  <Home className="w-5 h-5" />
                  <span>Mis Cuentos</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/perfil" 
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                  onClick={closeMobileMenu}
                >
                  <User className="w-5 h-5" />
                  <span>Mi Perfil</span>
                </Link>
              </li>
              
              {isAdmin && (
                <>
                  <li className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                    <span className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Administración
                    </span>
                  </li>
                  <li>
                    <Link 
                      to="/admin/prompts" 
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                      onClick={closeMobileMenu}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Prompts</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/admin/analytics" 
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                      onClick={closeMobileMenu}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>Analytics</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/admin/flujo" 
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                      onClick={closeMobileMenu}
                    >
                      <AlertTriangle className="w-5 h-5" />
                      <span>Flujo</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/admin/style" 
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                      onClick={closeMobileMenu}
                    >
                      <Palette className="w-5 h-5" />
                      <span>Estilos</span>
                    </Link>
                  </li>
                </>
              )}
              
              <li className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-2">
                <button
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
