// Utilidad para mostrar toasts de manera programática
// Compatible con el sistema de ToastContainer existente

export interface ToastConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Event dispatcher para toasts programáticos
const toastEvent = new EventTarget();

export const showToast = (config: ToastConfig) => {
  const event = new CustomEvent('showToast', {
    detail: {
      id: Math.random().toString(36).substr(2, 9),
      ...config,
      duration: config.duration || 3000
    }
  });
  toastEvent.dispatchEvent(event);
};

// Hook para escuchar eventos de toast
export const useToastEvents = () => {
  const addEventListener = (callback: (event: CustomEvent) => void) => {
    toastEvent.addEventListener('showToast', callback as EventListener);
    return () => toastEvent.removeEventListener('showToast', callback as EventListener);
  };

  return { addEventListener };
};