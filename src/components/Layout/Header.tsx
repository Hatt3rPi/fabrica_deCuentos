import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, BookOpen, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCartOperations } from '../../contexts/CartContext';
import NotificationBell from '../Notifications/NotificationBell';
import MobileSidebar from './MobileSidebar';
import ProfileDropdown from './ProfileDropdown';
import CartIcon from '../Cart/CartIcon';
import ShoppingCart from '../Cart/ShoppingCart';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isOpen: cartOpen, openCart, closeCart } = useCartOperations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Ya no necesitamos handler de checkout personalizado

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
    <header ref={headerRef} className={`bg-white shadow-md dark:bg-gray-800 dark:text-white h-[81px] flex items-center ${className}`}>
      <div className="w-full flex items-center justify-between px-4 md:px-6">
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
          <div className="flex items-center gap-1">
            <CartIcon onClick={openCart} />
            <div className="relative">
              <NotificationBell />
            </div>
            <div className="ml-2">
              <ProfileDropdown />
            </div>
          </div>
        </div>

        {/* Logo and title */}
        <div className="hidden lg:flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            La CuenterIA
          </h1>
        </div>

        {/* User info and controls */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
          <CartIcon onClick={openCart} />
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
          <NotificationBell />
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
          <ProfileDropdown />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
      
      {/* Shopping Cart */}
      <ShoppingCart 
        isOpen={cartOpen}
        onClose={closeCart}
      />
    </header>
  );
};

export default Header;
