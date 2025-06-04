import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, AlertTriangle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = useAdmin();

  const navItems = [
    { 
      to: '/nuevo-cuento/personajes', 
      icon: BookOpen, 
      label: 'Crear cuento',
      description: 'Comienza una nueva historia desde cero',
      color: 'from-purple-500 to-indigo-500'
    },
    { 
      to: '/home', 
      icon: BookOpen, 
      label: 'Ver cuentos',
      description: 'Tus historias creadas y en progreso',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      to: '/perfil', 
      icon: User, 
      label: 'Mi Perfil',
      description: 'Configura tu perfil y preferencias',
      color: 'from-amber-500 to-orange-500'
    },
    ...(isAdmin ? [{
      to: '/admin/prompts', 
      icon: AlertTriangle, 
      label: 'Administrar',
      description: 'Gestionar contenido del sistema',
      color: 'from-emerald-500 to-teal-500'
    }] : []),
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 py-4 px-4 sm:px-6 md:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 md:mb-10 lg:mb-12">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl md:text-4xl lg:text-5xl">
            Bienvenido a CuenterIA
          </h1>
          <p className="mt-2 max-w-2xl mx-auto text-base text-gray-500 dark:text-gray-300 sm:mt-3 sm:text-lg md:mt-4">
            Explora todas las posibilidades de crear historias asombrosas
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 max-w-4xl mx-auto md:max-w-5xl lg:max-w-6xl sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => (
            <div 
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`
                group relative p-4 sm:p-5 rounded-2xl overflow-hidden
                bg-white dark:bg-gray-800 shadow-md hover:shadow-lg
                transition-all duration-300 cursor-pointer h-32 sm:h-36 md:h-40 lg:h-48 flex flex-col
                border-2 border-transparent hover:border-opacity-50
                ${item.color === 'from-purple-500 to-indigo-500' ? 'hover:border-purple-500' : 
                  item.color === 'from-blue-500 to-cyan-500' ? 'hover:border-blue-500' :
                  item.color === 'from-amber-500 to-orange-500' ? 'hover:border-amber-500' :
                  'hover:border-emerald-500'}
                transform hover:-translate-y-0.5 md:hover:-translate-y-1
              `}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-2 sm:p-2.5 md:p-3 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md`}>
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                    {item.label}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 flex-1 line-clamp-2 md:line-clamp-3">
                  {item.description}
                </p>
                <div className="mt-3 sm:mt-4 text-right">
                  <span className="inline-flex items-center text-xs sm:text-sm md:text-base font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                    <span className="hidden sm:inline">Ir a </span>{item.label.toLowerCase()}
                    <svg className="ml-1 sm:ml-2 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
