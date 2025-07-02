import React, { useEffect, useRef } from 'react';
import { X, Home, User, Settings, BarChart3, AlertTriangle, LogOut, BookOpen, Bug, Moon, Sun, Palette } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';


interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const { signOut } = useAuth();
  const isAdmin = useAdmin();
  const location = useLocation();
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const isMounted = useRef(true);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al cambiar de ruta
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Efecto para manejar el cambio de tema
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Prevenir el scroll del cuerpo cuando el menú está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Manejar clic fuera del menú
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInside = sidebarRef.current?.contains(target) || 
                          menuButtonRef.current?.contains(target);
      
      if (!isClickInside) {
        onClose();
      }
    };

    // Usar un pequeño retraso para evitar que el clic del botón active el cierre
    const timer = setTimeout(() => {
      // Verificar que el menú siga abierto y el componente esté montado
      if (isOpen && isMounted.current) {
        document.addEventListener('click', handleClickOutside);
      }
    }, 10);
    
    return () => {
      // Marcar el componente como desmontado
      isMounted.current = false;
      
      // Limpiar el timeout si aún está pendiente
      clearTimeout(timer);
      
      // Asegurarse de limpiar el listener
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);



  return (
    <>
      {/* Fondo semitransparente con transición */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>
      
      {/* Sidebar móvil */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="Menú de navegación"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con degradado */}
        <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-500 dark:from-purple-800 dark:to-blue-700 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="text-lg font-bold tracking-tight">CuenterIA</div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1 px-2">
            <li>
              <Link 
                to="/home" 
                className="group flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors duration-200"
              >
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/70 transition-colors duration-200">
                  <Home className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <span className="font-medium">Mis Cuentos</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/perfil" 
                className="group flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors duration-200"
              >
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/70 transition-colors duration-200">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <span className="font-medium">Mi Perfil</span>
              </Link>
            </li>
            
            {isAdmin && (
              <>
                <li className="mt-6 mb-2 px-4">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Administración
                  </span>
                </li>
                <li>
                  <Link 
                    to="/admin/prompts" 
                    className="group flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors duration-200"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/70 transition-colors duration-200">
                      <Settings className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <span className="font-medium">Prompts</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/analytics" 
                    className="group flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors duration-200"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/70 transition-colors duration-200">
                      <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <span className="font-medium">Analytics</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/flujo" 
                    className="group flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors duration-200"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 group-hover:bg-rose-200 dark:group-hover:bg-rose-800/70 transition-colors duration-200">
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                    </div>
                    <span className="font-medium">Flujo</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/style" 
                    className="group flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors duration-200"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/70 transition-colors duration-200">
                      <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <span className="font-medium">Estilos</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/debug" 
                    className="group flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors duration-200"
                  >
                    <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/70 transition-colors duration-200">
                      <Bug className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                    </div>
                    <span className="font-medium">Diagnóstico</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 mt-auto">
          {/* Botón de cambio de tema */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleDarkMode}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5 mr-3" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 mr-3" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="group w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-red-50 dark:text-gray-300 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
          >
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50 group-hover:bg-red-200 dark:group-hover:bg-red-800/70 transition-colors duration-200">
              <LogOut className="w-5 h-5 text-red-600 dark:text-red-300" />
            </div>
            <span className="font-medium">Cerrar Sesión</span>
          </button>
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
