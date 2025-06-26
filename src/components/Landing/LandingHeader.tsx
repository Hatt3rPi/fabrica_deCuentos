import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingHeaderProps {
  isScrolled: boolean;
  section: 'hero' | 'features' | 'cta' | 'footer';
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ isScrolled, section }) => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determinar el estilo del header según la sección y el scroll
  const getHeaderStyles = () => {
    const baseStyles = 'fixed w-full z-50 transition-all duration-300 border-b';
    
    if (isScrolled) {
      switch(section) {
        case 'hero':
          return `${baseStyles} bg-amber-50/95 backdrop-blur-sm shadow-sm border-amber-100`;
        case 'features':
          return `${baseStyles} bg-amber-50/95 backdrop-blur-sm shadow-sm border-amber-100`;
        case 'cta':
          return `${baseStyles} bg-amber-50/95 backdrop-blur-sm shadow-sm border-amber-100`;
        case 'footer':
          return `${baseStyles} bg-amber-50/95 backdrop-blur-sm shadow-sm border-amber-100`;
        default:
          return `${baseStyles} bg-amber-50/95 backdrop-blur-sm shadow-sm border-amber-100`;
      }
    }
    
    return `${baseStyles} bg-transparent border-transparent`;
  };

  // Determinar el color del texto según la sección
  const getTextColor = () => {
    return isScrolled ? 'text-amber-900' : 'text-white';
  };
  
  // Cerrar menú móvil al cambiar el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para manejar el scroll suave
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Cerrar el menú móvil si está abierto
      setIsMenuOpen(false);
    }
  };
  
  // Opciones de animación para los elementos del menú
  const navItems = [
    { id: 'hero', label: 'Inicio', section: 'hero' },
    { id: 'historias', label: 'Historias', section: 'historias' },
    { id: 'features', label: 'Características', section: 'features' },
    { id: 'cta', label: 'Crear', section: 'cta' },
  ];
  
  // Configuración de animación
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <header className={getHeaderStyles()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-between md:space-x-10">
          {/* Logo */}
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to="/" className="flex items-center group">
              <span className="text-2xl mr-2 group-hover:rotate-6 transition-transform">📚</span>
              <span className={`text-2xl font-serif font-bold ${getTextColor()} bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent`}>
                La Cuentería
              </span>
            </Link>
          </div>

          {/* Menú móvil */}
          <div className="-mr-2 -my-2 md:hidden">
            <button
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${isScrolled && section === 'features' ? 'text-gray-700' : 'text-white'} hover:text-gray-300 focus:outline-none`}
              onClick={() => setIsMenuOpen(true)}
            >
              <span className="sr-only">Abrir menú</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Menú de navegación - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <motion.div 
              className="flex items-center space-x-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {navItems.map((navItem) => (
                <motion.div key={navItem.id} variants={item}>
                  <a 
                    href={`#${navItem.id}`}
                    onClick={(e) => scrollToSection(e, navItem.id)}
                    className={`text-base font-medium ${getTextColor()} hover:text-amber-600 transition-colors relative group`}
                  >
                    {navItem.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full"></span>
                  </a>
                </motion.div>
              ))}
              <motion.div variants={item}>
                <Link
                  to={user ? "/home" : "/login"}
                  className="ml-2 whitespace-nowrap inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-base font-medium border shadow-sm transition-all duration-300 bg-amber-300 hover:bg-amber-400 text-amber-900 border-amber-400"
                >
                  {user ? 'Mi Cuenta' : 'Comenzar'}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
          </nav>
        </div>
      </div>

      {/* Menú móvil */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Fondo semitransparente */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Panel lateral */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
              className="fixed top-0 right-0 z-50 w-4/5 max-w-sm h-full bg-white shadow-xl overflow-y-auto md:hidden flex flex-col"
            >
              {/* Encabezado del menú */}
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">📚</span>
                  <span className="text-xl font-serif font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
                    La Cuentería
                  </span>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="sr-only">Cerrar menú</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Contenido del menú */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <nav className="space-y-2">
                  {navItems.map((navItem) => (
                    <motion.a
                      key={`mobile-${navItem.id}`}
                      href={`#${navItem.id}`}
                      onClick={(e) => scrollToSection(e, navItem.id)}
                      className="block p-3 rounded-lg hover:bg-amber-50 transition-colors"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 15,
                        delay: 0.1 * navItems.indexOf(navItem)
                      }}
                    >
                      <span className="text-base font-medium text-amber-900">{navItem.label}</span>
                    </motion.a>
                  ))}
                </nav>
                
                <motion.div
                  className="pt-4 mt-4 border-t border-gray-100"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                    delay: 0.1 * navItems.length
                  }}
                >
                  <Link
                    to={user ? "/home" : "/login"}
                    className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-base font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors border border-amber-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {user ? 'Mi Cuenta' : 'Comenzar'}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingHeader;
