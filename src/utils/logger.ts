/**
 * Sistema de logging condicional para La CuenteAI
 * 
 * Utiliza import.meta.env.DEV para determinar si los logs se muestran.
 * En producción, solo se muestran warnings y errores.
 * Integrado con Sentry para monitoreo automático en producción.
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
  warn: (message: string, ...data: any[]) => {
    console.warn(message, ...data);
    
    // Enviar warnings importantes a Sentry en producción
    if (!isDev) {
      Sentry.captureMessage(message, 'warning');
      if (data.length > 0) {
        Sentry.setContext('warning_data', { data });
      }
    }
  },

  /**
   * Errores - siempre activos + Sentry
   * Usar para errores críticos y excepciones
   */
  error: (message: string, error?: Error | any, context?: Record<string, any>) => {
    console.error(message, error, context);
    
    // Enviar todos los errores a Sentry
    if (!isDev) {
      if (error instanceof Error) {
        // Si es un Error object, usar captureException
        Sentry.captureException(error, {
          tags: { source: 'logger' },
          extra: { message, context }
        });
      } else {
        // Si es solo un mensaje, usar captureMessage
        Sentry.captureMessage(message, 'error');
        if (context || error) {
          Sentry.setContext('error_data', { 
            additionalData: error,
            context 
          });
        }
      }
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
  },

  /**
   * Función específica para errores de red/API
   */
  apiError: (endpoint: string, error: Error | any, requestData?: any) => {
    const message = `API Error en ${endpoint}`;
    console.error(message, error, requestData);
    
    if (!isDev) {
      Sentry.captureException(error instanceof Error ? error : new Error(message), {
        tags: { 
          source: 'api',
          endpoint 
        },
        extra: { 
          endpoint,
          requestData,
          errorDetails: error
        }
      });
    }
  },

  /**
   * Función para errores de usuario/UX
   */
  userError: (action: string, error: Error | any, userContext?: any) => {
    const message = `User Error durante ${action}`;
    console.error(message, error, userContext);
    
    if (!isDev) {
      Sentry.captureException(error instanceof Error ? error : new Error(message), {
        tags: { 
          source: 'user_action',
          action 
        },
        extra: { 
          action,
          userContext,
          errorDetails: error
        }
      });
    }
  },

  /**
   * Enviar evento personalizado a Sentry
   */
  sentryEvent: (eventName: string, data?: Record<string, any>) => {
    if (!isDev) {
      Sentry.addBreadcrumb({
        message: eventName,
        data,
        timestamp: Date.now() / 1000,
      });
    }
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
 * Utility para configurar contexto de usuario en Sentry
 */
export const setUserContext = (user: { id: string; email?: string; [key: string]: any }) => {
  if (!isDev) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      ...user
    });
  }
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
  }
};