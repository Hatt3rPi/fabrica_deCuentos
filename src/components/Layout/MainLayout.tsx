import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import CreateStoryButton from '../Common/CreateStoryButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Check screen size and handle resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < 768; // md breakpoint (solo móvil)
      const desktop = width >= 1024; // lg breakpoint (escritorio)
      
      setIsMobile(mobile);
      setIsDesktop(desktop);
      
      // En móvil, el menú inicia cerrado
      // En escritorio, el menú inicia abierto
      if (desktop) {
        setIsMenuOpen(true);
      } else if (mobile) {
        setIsMenuOpen(false);
      }
    };

    // Initial check
    checkScreenSize();
    
    // Add event listeners
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Handle menu open/close with animations
  useEffect(() => {
    // Always ensure body is scrollable and positioned correctly
    const resetBodyStyles = () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };

    if (!isMobile && !isDesktop) {
      // Reset any mobile-specific styles when not in mobile view
      resetBodyStyles();
      return;
    }

    if (isMenuOpen) {
      // Disable body scroll when menu is open on mobile
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Re-enable body scroll with a delay to allow animation to complete
      const timer = setTimeout(resetBodyStyles, 300);
      return () => clearTimeout(timer);
    }

    // Cleanup on unmount
    return () => resetBodyStyles();
  }, [isMenuOpen, isMobile]);

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => e.stopPropagation();
  const handleTouchMove = (e: React.TouchEvent) => e.stopPropagation();
  const handleTouchEnd = (e: React.TouchEvent) => e.stopPropagation();
  
  // Mobile and Desktop touch handlers
  const touchHandlers = (isMobile || isDesktop) ? {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  } : {};

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = () => {
    if (isMobile || isDesktop) {
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative">
      <Header onMenuToggle={handleMenuToggle} isMenuOpen={isMenuOpen} />
      <CreateStoryButton />
      
      <div className="flex flex-1 overflow-hidden pt-16 h-[calc(100vh-4rem)]">
        {/* Sidebar with animation */}
        <AnimatePresence mode="wait">
          {/* Overlay solo para móvil */}
          {isMobile && isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-30"
              onClick={handleMenuToggle}
            />
          )}

          {/* Sidebar para móvil */}
          {isMobile && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: isMenuOpen ? 0 : '-100%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 z-40 w-64"
            >
              <Sidebar isMobile={true} onNavigation={handleNavigation} isMenuOpen={true} />
            </motion.div>
          )}

            {/* Sidebar para tablet */}
          {!isMobile && !isDesktop && (
            <div className="hidden md:block w-64 xl:w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
              <Sidebar isMobile={false} onNavigation={handleNavigation} isMenuOpen={true} />
            </div>
          )}

          {/* Sidebar para escritorio */}
          {isDesktop && (
            <motion.div
              initial={{ width: '5rem' }}
              animate={{ width: isMenuOpen ? '16rem' : '5rem' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 z-40"
            >
              <Sidebar isMobile={false} onNavigation={handleNavigation} isMenuOpen={isMenuOpen} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main 
          ref={mainRef}
          className={`
            flex-1 overflow-y-auto focus:outline-none w-full
            bg-gray-50 dark:bg-gray-900
            transition-all duration-300 
            ${isMobile ? 'ml-0' : 'md:ml-64'}
            ${isDesktop && !isMenuOpen ? 'md:ml-20' : ''}
            relative h-full
          `}
          {...touchHandlers}
          style={{
            WebkitOverflowScrolling: 'touch',
            WebkitTapHighlightColor: 'transparent',
            scrollBehavior: 'smooth',
            // Asegurar que el contenido principal no se oculte detrás del header
            scrollPaddingTop: '4rem'
          }}
        >
          <div className={isMenuOpen && isMobile ? 'pointer-events-none min-h-full' : 'min-h-full'}>
            <div className="min-h-full w-full max-w-[100vw] overflow-x-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
