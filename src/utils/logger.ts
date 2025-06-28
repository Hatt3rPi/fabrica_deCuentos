/**
 * Sistema de logging condicional para La CuenteAI
 * 
 * Utiliza import.meta.env.DEV para determinar si los logs se muestran.
 * En producción, solo se muestran warnings y errores.
 * Integrado con Sentry para monitoreo de errores en producción.
 */

import * as Sentry from "@sentry/react";

const isDev = import.meta.env.DEV;

/**
 * Logger centralizado que solo muestra logs en desarrollo
 */
export const logger = {
  /**
   * Logs de debug - solo en desarrollo
   * Usar para información detallada de flujo y estado
   */
  debug: isDev ? console.log : () => {},

  /**
   * Logs informativos - solo en desarrollo  
   * Usar para información general del sistema
   */
  info: isDev ? console.info : () => {},

  /**
   * Warnings - siempre activos
   * Usar para advertencias que no rompen funcionalidad
   */
  warn: console.warn,

  /**
   * Errores - siempre activos
   * Usar para errores críticos y excepciones
   */
  error: (message: string, error?: Error | any, context?: Record<string, any>) => {
    console.error(message, error, context);
    if (!isDev && error instanceof Error) {
      Sentry.captureException(error, {
        tags: { source: 'logger' },
        extra: { message, context }
      });
    }
  },

  /**
   * Log condicional personalizado
   * @param condition - Condición para mostrar el log
   * @param message - Mensaje a mostrar
   * @param data - Datos adicionales (opcional)
   */
  conditional: (condition: boolean, message: string, ...data: any[]) => {
    if (isDev && condition) {
      console.log(message, ...data);
    }
  },

  /**
   * Grupo de logs - solo en desarrollo
   * Útil para agrupar logs relacionados
   */
  group: isDev ? {
    start: (label: string) => console.group(label),
    end: () => console.groupEnd(),
    collapsed: (label: string) => console.groupCollapsed(label)
  } : {
    start: () => {},
    end: () => {},
    collapsed: () => {}
  }
};

/**
 * Utility para medir performance - solo en desarrollo
 */
export const perfLogger = {
  start: isDev ? (label: string) => console.time(label) : () => {},
  end: isDev ? (label: string) => console.timeEnd(label) : () => {},
};

/**
 * Log específico para wizard flow - solo en desarrollo
 */
export const wizardLogger = {
  step: isDev ? (step: string, data?: any) => {
    console.log(`🧙‍♂️ [Wizard] ${step}`, data || '');
  } : () => {},
  
  error: (step: string, error: Error) => {
    console.error(`🧙‍♂️ [Wizard Error] ${step}:`, error);
    if (!isDev) {
      Sentry.captureException(error, {
        tags: { source: 'wizard', step },
        extra: { wizardStep: step }
      });
    }
  }
};

/**
 * Log específico para autosave - solo en desarrollo
 */
export const autosaveLogger = {
  start: isDev ? (storyId: string) => {
    console.log(`💾 [AutoSave] Iniciando save para story: ${storyId}`);
  } : () => {},
  
  success: isDev ? () => {
    console.log('💾 [AutoSave] ✅ Save completado exitosamente');
  } : () => {},
  
  error: (error: Error) => {
    console.error('💾 [AutoSave] ❌ Error al persistir:', error);
    if (!isDev) {
      Sentry.captureException(error, {
        tags: { source: 'autosave' },
        extra: { context: 'save_failed' }
      });
    }
  }
};

/**
 * Funciones especializadas para Sentry
 */
export const sentryLogger = {
  /**
   * Capturar mensaje personalizado
   */
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    if (!isDev) {
      Sentry.captureMessage(message, level);
    }
  },

  /**
   * Capturar excepción con contexto adicional
   */
  captureException: (error: Error, context?: Record<string, any>) => {
    if (!isDev) {
      Sentry.captureException(error, {
        extra: context
      });
    }
  },

  /**
   * Establecer contexto de usuario
   */
  setUserContext: (user: { id: string; email?: string }) => {
    if (!isDev) {
      Sentry.setUser({
        id: user.id,
        email: user.email
      });
    }
  },

  /**
   * Limpiar contexto de usuario (logout)
   */
  clearUserContext: () => {
    if (!isDev) {
      Sentry.setUser(null);
    }
  },

  /**
   * Añadir breadcrumb personalizado
   */
  addBreadcrumb: (message: string, category: string, data?: Record<string, any>) => {
    if (!isDev) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info'
      });
    }
  }
};