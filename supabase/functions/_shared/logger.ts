/**
 * Sistema de logging centralizado para Edge Functions
 * 
 * Proporciona logging estructurado y seguro para todas las Edge Functions,
 * integrándose con Sentry para monitoreo en producción.
 */

import { captureMessage, addBreadcrumb, captureException } from './sentry.ts';

const isDev = Deno.env.get('DENO_ENV') !== 'production';

export interface LogContext {
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger centralizado para Edge Functions
 */
export class EdgeFunctionLogger {
  private functionName: string;
  private context: LogContext = {};

  constructor(functionName: string) {
    this.functionName = functionName;
    this.setContext('function', functionName);
  }

  /**
   * Configura contexto adicional para todos los logs
   */
  setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  /**
   * Limpia contexto sensible
   */
  clearSensitiveContext(): void {
    const sensitiveKeys = ['payload', 'prompt', 'token', 'password', 'key'];
    sensitiveKeys.forEach(key => {
      if (key in this.context) {
        delete this.context[key];
      }
    });
  }

  /**
   * Log de debug - solo en desarrollo
   */
  debug(message: string, context?: LogContext): void {
    if (isDev) {
      const fullContext = { ...this.context, ...context };
      console.log(`🔍 [${this.functionName}] ${message}`, fullContext);
    }
  }

  /**
   * Log informativo - solo en desarrollo
   */
  info(message: string, context?: LogContext): void {
    const fullContext = { ...this.context, ...context };
    
    if (isDev) {
      console.log(`ℹ️ [${this.functionName}] ${message}`, fullContext);
    }
    
    // Agregar breadcrumb para Sentry
    addBreadcrumb(
      `${this.functionName}: ${message}`,
      'info',
      'info',
      this.sanitizeContext(fullContext)
    );
  }

  /**
   * Log de advertencia - siempre activo
   */
  warn(message: string, context?: LogContext): void {
    const fullContext = { ...this.context, ...context };
    const sanitizedContext = this.sanitizeContext(fullContext);
    
    console.warn(`⚠️ [${this.functionName}] ${message}`, sanitizedContext);
    
    // Enviar a Sentry en producción
    if (!isDev) {
      captureMessage(
        `${this.functionName}: ${message}`,
        'warning'
      );
    }
  }

  /**
   * Log de error - siempre activo
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const fullContext = { ...this.context, ...context };
    const sanitizedContext = this.sanitizeContext(fullContext);
    
    console.error(`❌ [${this.functionName}] ${message}`, error, sanitizedContext);
    
    // Enviar a Sentry
    if (error instanceof Error) {
      captureException(error, {
        function: this.functionName,
        message,
        ...sanitizedContext,
      });
    } else {
      captureMessage(
        `${this.functionName}: ${message}`,
        'error'
      );
    }
  }

  /**
   * Log de inicio de operación
   */
  startOperation(operation: string, context?: LogContext): void {
    this.info(`🚀 Starting ${operation}`, context);
  }

  /**
   * Log de finalización exitosa de operación
   */
  completeOperation(operation: string, duration?: number, context?: LogContext): void {
    const durationInfo = duration ? `(${duration}ms)` : '';
    this.info(`✅ Completed ${operation} ${durationInfo}`, context);
  }

  /**
   * Log de falla de operación
   */
  failOperation(operation: string, error: Error, duration?: number, context?: LogContext): void {
    const durationInfo = duration ? `(${duration}ms)` : '';
    this.error(`❌ Failed ${operation} ${durationInfo}`, error, context);
  }

  /**
   * Sanitiza contexto removiendo datos sensibles
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {};
    
    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      
      // Filtrar claves sensibles
      if (this.isSensitiveKey(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        // Truncar strings muy largos
        sanitized[key] = value.substring(0, 1000) + '... [TRUNCATED]';
      } else if (typeof value === 'object' && value !== null) {
        // Sanitizar objetos anidados
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Verifica si una clave es sensible
   */
  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      'password', 'token', 'key', 'secret', 'prompt', 'payload',
      'authorization', 'bearer', 'api_key', 'openai', 'content'
    ];
    
    return sensitivePatterns.some(pattern => key.includes(pattern));
  }

  /**
   * Sanitiza objetos anidados
   */
  private sanitizeObject(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'object' && item !== null ? '[OBJECT]' : item
      );
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return '[OBJECT]';
    }
    
    return obj;
  }
}

/**
 * Crea un logger para una Edge Function específica
 */
export function createEdgeFunctionLogger(functionName: string): EdgeFunctionLogger {
  return new EdgeFunctionLogger(functionName);
}

/**
 * Wrapper para medir performance de operaciones
 */
export async function withPerformanceLogging<T>(
  logger: EdgeFunctionLogger,
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  logger.startOperation(operation, context);
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.completeOperation(operation, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.failOperation(operation, error as Error, duration, context);
    throw error;
  }
}

/**
 * Funciones de conveniencia para logging rápido
 */
export const log = {
  debug: (functionName: string, message: string, context?: LogContext) => {
    const logger = createEdgeFunctionLogger(functionName);
    logger.debug(message, context);
  },
  
  info: (functionName: string, message: string, context?: LogContext) => {
    const logger = createEdgeFunctionLogger(functionName);
    logger.info(message, context);
  },
  
  warn: (functionName: string, message: string, context?: LogContext) => {
    const logger = createEdgeFunctionLogger(functionName);
    logger.warn(message, context);
  },
  
  error: (functionName: string, message: string, error?: Error, context?: LogContext) => {
    const logger = createEdgeFunctionLogger(functionName);
    logger.error(message, error, context);
  },
};