import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';

// Configurar Sentry lo más temprano posible
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://5b605afc70c152cf32df6ee03964549e@o4509578325524480.ingest.us.sentry.io/4509578344333312",
  environment: import.meta.env.MODE, // 'development' o 'production'
  enabled: import.meta.env.PROD, // Solo activar en producción
  
  // Configuración de integración con React Router
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false, // Para debugging en desarrollo
      blockAllMedia: false,
    }),
  ],
  
  // Performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% en prod, 100% en dev
  
  // Session replay
  replaysSessionSampleRate: 0.1, // 10% de sesiones
  replaysOnErrorSampleRate: 1.0, // 100% cuando hay errores
  
  // Información de usuario automática
  sendDefaultPii: true,
  
  // Release tracking
  release: import.meta.env.VITE_APP_VERSION,
  
  // Tags adicionales
  tags: {
    component: "frontend",
  },
  
  // Solo capturar errores relevantes
  beforeSend(event) {
    // Filtrar errores conocidos o irrelevantes
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('Script error') || 
          error?.value?.includes('ResizeObserver loop limit exceeded')) {
        return null; // No enviar estos errores
      }
    }
    return event;
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
