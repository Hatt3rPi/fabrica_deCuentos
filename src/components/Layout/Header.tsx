import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, BookOpen } from 'lucide-react';
import NotificationBell from '../Notifications/NotificationBell';
import ThemeToggleButton from './ThemeToggleButton';
import MobileSidebar from './MobileSidebar';
import ProfileDropdown from './ProfileDropdown';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

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
        <div className="w-full lg:hidden flex items-center justify-between">
          {/* Botón de menú a la izquierda */}
          <button
            id="mobile-menu-button"
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Título centrado */}
          <div className="flex-1 flex justify-center px-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
              La CuenterIA
            </h1>
          </div>

          {/* Controles de la derecha */}
          <div className="flex items-center gap-2 ml-2">
            <ThemeToggleButton />
            <div className="relative">
              <NotificationBell />
            </div>
            <div className="hidden md:block">
              <ProfileDropdown />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center flex-1">
          {/* Logo and title */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              La CuenterIA
            </h1>
          </div>

          {/* User info and controls - Empujado a la derecha */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggleButton />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
            <NotificationBell />
            <ProfileDropdown />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
};

export default Header;
