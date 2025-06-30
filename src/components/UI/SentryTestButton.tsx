import React from 'react';

/**
 * Componente de prueba para verificar la integración de Sentry
 * Este botón genera un error intencional para confirmar que Sentry
 * está capturando y reportando errores correctamente.
 * 
 * IMPORTANTE: Este componente es solo para testing y debe ser
 * removido antes de ir a producción.
 */
const SentryTestButton: React.FC = () => {
  const handleTestError = () => {
    throw new Error("This is your first error!");
  };

  return (
    <button
      onClick={handleTestError}
      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg transition-colors duration-200 flex items-center gap-2"
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
        />
      </svg>
      Test Sentry Error
    </button>
  );
};

export default SentryTestButton;