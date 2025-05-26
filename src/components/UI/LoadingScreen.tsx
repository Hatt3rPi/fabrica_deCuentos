import React from 'react';
import { Loader } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="text-center">
        <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-medium text-purple-800 mb-2">Cargando...</h2>
        <p className="text-sm text-purple-600">Estamos recuperando tu sesión</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

