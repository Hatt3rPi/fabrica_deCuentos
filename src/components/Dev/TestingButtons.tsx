import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, ShieldOff, ShoppingCart, DollarSign, Wrench } from 'lucide-react';

const TestingButtons: React.FC = () => {
  const navigate = useNavigate();
  
  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  const testingRoutes = [
    {
      path: '/debug',
      label: 'Debug',
      icon: Bug,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Diagnóstico del sistema'
    },
    {
      path: '/unauthorized',
      label: 'Unauthorized',
      icon: ShieldOff,
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'Página de error de permisos'
    },
    {
      path: '/home',
      label: 'Carrito',
      icon: ShoppingCart,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Ver historias completadas'
    },
    {
      path: '/admin/precios',
      label: 'Admin Precios',
      icon: DollarSign,
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Gestión de productos'
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border-2 border-yellow-400">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-5 h-5 text-yellow-600" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Testing Tools
          </h3>
        </div>
        
        <div className="grid gap-2">
          {testingRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <button
                key={route.path}
                onClick={() => navigate(route.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm font-medium transition-colors ${route.color}`}
                title={route.description}
              >
                <Icon className="w-4 h-4" />
                <span>{route.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Solo visible en desarrollo
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestingButtons;