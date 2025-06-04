import React, { useRef, useEffect, useState } from 'react';
import { BookOpen, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../Notifications/NotificationBell';
import ThemeToggleButton from '../Common/ThemeToggleButton';

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen = false }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Set header height CSS variable for notification positioning
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };

    // Handle scroll effect
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    // Initial update
    updateHeaderHeight();

    // Add event listeners
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Force an update after a short delay to ensure all elements are rendered
    const timeoutId = setTimeout(updateHeaderHeight, 100);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [scrolled]);

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header 
      ref={headerRef} 
      className={`fixed top-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm py-2 sm:py-3 px-4 transition-all duration-300 z-40 border-b border-gray-100 dark:border-gray-800 ${
        scrolled ? 'shadow-sm' : ''
      }`}
      style={{
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center">
          {/* Menu button - Visible on mobile and desktop */}
          <button 
            className="p-1.5 mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            onClick={onMenuToggle}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo and title - Clickable to go home */}
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 focus:outline-none group"
            aria-label="Ir al inicio"
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-sm group-hover:opacity-90 transition-opacity">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              La CuenterIA
            </h1>
          </button>
        </div>

        {/* Espacio flexible para centrar el logo */}
        <div className="flex-1"></div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <NotificationBell />
          
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700"
              aria-label="Menú de usuario"
              aria-expanded={showUserMenu}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </button>
            
            {/* User dropdown menu */}
            {showUserMenu && (
              <>
                {/* Overlay */}
                <div 
                  className="fixed inset-0 z-40 bg-black/10"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden="true"
                />
                
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {user?.user_metadata?.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/perfil');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Mi perfil
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      

    </header>
  );
};

export default Header;
