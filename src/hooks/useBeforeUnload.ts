import { useEffect } from 'react';

type BeforeUnloadHandler = (event: BeforeUnloadEvent) => void;

/**
 * Hook para mostrar una advertencia al usuario cuando intenta cerrar la pestaña o navegar fuera de la página
 * con cambios sin guardar.
 * 
 * @param handler Función que se ejecutará cuando el usuario intente cerrar la pestaña
 */
export const useBeforeUnload = (handler: BeforeUnloadHandler) => {
  useEffect(() => {
    window.addEventListener('beforeunload', handler);
    
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [handler]);
};

