/**
 * Sentry integration for Supabase Edge Functions
 * 
 * Provides error tracking and performance monitoring for Edge Functions
 * using Sentry's Universal API compatible with Deno
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sentry Universal API for Deno
const SENTRY_API_URL = 'https://sentry.io/api/0/projects/lacuenteria/lacuenteriacl/store/';

interface SentryEvent {
  event_id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  message?: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function?: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  tags?: Record<string, string>;
  contexts?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
  };
  extra?: Record<string, any>;
  breadcrumbs?: Array<{
    timestamp: string;
    message: string;
    category?: string;
    level?: string;
    data?: Record<string, any>;
  }>;
  environment: string;
  platform: string;
  server_name?: string;
}

class SentryEdgeFunctions {
  private dsn: string;
  private environment: string;
  private breadcrumbs: Array<any> = [];
  private context: Record<string, any> = {};
  private tags: Record<string, string> = {};
  private user: Record<string, any> = {};

  constructor() {
    // DSN desde variables de entorno
    this.dsn = Deno.env.get('SENTRY_DSN') || '';
    this.environment = Deno.env.get('DENO_ENV') || 'development';
    
    if (!this.dsn) {
      console.warn('[sentry] SENTRY_DSN not configured, error reporting disabled');
    }
  }

  /**
   * Captura una excepción y la envía a Sentry
   */
  async captureException(error: Error, extra?: Record<string, any>): Promise<void> {
    if (!this.dsn) return;

    const event = this.createEvent('error', {
      exception: {
        values: [{
          type: error.name || 'Error',
          value: error.message,
          stacktrace: this.parseStackTrace(error.stack),
        }],
      },
      extra: { ...extra, originalError: error.toString() },
    });

    await this.sendEvent(event);
  }

  /**
   * Captura un mensaje y lo envía a Sentry
   */
  async captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info', extra?: Record<string, any>): Promise<void> {
    if (!this.dsn) return;

    const event = this.createEvent(level, {
      message,
      extra,
    });

    await this.sendEvent(event);
  }

  /**
   * Agrega contexto que se incluirá en eventos futuros
   */
  setContext(key: string, value: any): void {
    this.context[key] = value;
  }

  /**
   * Configura el usuario para eventos futuros
   */
  setUser(user: { id?: string; email?: string; [key: string]: any }): void {
    this.user = { ...user };
  }

  /**
   * Agrega tags que se incluirán en eventos futuros
   */
  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  /**
   * Agrega múltiples tags
   */
  setTags(tags: Record<string, string>): void {
    Object.assign(this.tags, tags);
  }

  /**
   * Agrega un breadcrumb para tracking de flujo
   */
  addBreadcrumb(message: string, category?: string, level?: string, data?: Record<string, any>): void {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      message,
      category: category || 'custom',
      level: level || 'info',
      data,
    });

    // Mantener solo los últimos 100 breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs = this.breadcrumbs.slice(-100);
    }
  }

  /**
   * Configura contexto específico para Edge Functions
   */
  configureForEdgeFunction(functionName: string, request?: Request): void {
    this.setTags({
      'function.name': functionName,
      'function.runtime': 'deno',
      'function.platform': 'supabase',
    });

    if (request) {
      this.setContext('request', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      });
    }

    this.setContext('runtime', {
      deno: Deno.version.deno,
      v8: Deno.version.v8,
      typescript: Deno.version.typescript,
    });
  }

  /**
   * Wrapper para manejar errores en funciones async
   */
  async withErrorCapture<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    this.addBreadcrumb(`Starting ${operationName}`, 'operation', 'info', context);
    
    try {
      const result = await operation();
      this.addBreadcrumb(`Completed ${operationName}`, 'operation', 'info');
      return result;
    } catch (error) {
      this.addBreadcrumb(`Failed ${operationName}`, 'operation', 'error', {
        error: error.message,
        ...context,
      });
      
      await this.captureException(error as Error, {
        operation: operationName,
        ...context,
      });
      
      throw error;
    }
  }

  /**
   * Crea un evento base de Sentry
   */
  private createEvent(level: string, data: Partial<SentryEvent>): SentryEvent {
    return {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      level: level as any,
      platform: 'javascript',
      environment: this.environment,
      server_name: 'supabase-edge-functions',
      tags: { ...this.tags },
      contexts: { ...this.context },
      user: { ...this.user },
      breadcrumbs: [...this.breadcrumbs],
      ...data,
    };
  }

  /**
   * Parsea stack trace para formato de Sentry
   */
  private parseStackTrace(stack?: string): any {
    if (!stack) return undefined;

    const frames = stack
      .split('\n')
      .slice(1) // Remover primera línea que es el mensaje de error
      .map(line => {
        const match = line.trim().match(/at (.+) \((.+):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            filename: match[2],
            lineno: parseInt(match[3]),
            colno: parseInt(match[4]),
          };
        }
        
        const simpleMatch = line.trim().match(/at (.+):(\d+):(\d+)/);
        if (simpleMatch) {
          return {
            filename: simpleMatch[1],
            lineno: parseInt(simpleMatch[2]),
            colno: parseInt(simpleMatch[3]),
          };
        }
        
        return null;
      })
      .filter(Boolean);

    return frames.length > 0 ? { frames } : undefined;
  }

  /**
   * Envía el evento a Sentry usando fetch API
   */
  private async sendEvent(event: SentryEvent): Promise<void> {
    try {
      const dsnParts = this.dsn.match(/https:\/\/(.+)@(.+)\/(.+)/);
      if (!dsnParts) {
        console.error('[sentry] Invalid DSN format');
        return;
      }

      const [, publicKey, host, projectId] = dsnParts;
      const url = `https://${host}/api/${projectId}/store/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=edge-functions/1.0.0`,
          'User-Agent': 'edge-functions/1.0.0',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        console.error('[sentry] Failed to send event:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[sentry] Error sending event:', error);
    }
  }
}

// Instancia global de Sentry para Edge Functions
export const sentry = new SentryEdgeFunctions();

// Funciones de conveniencia
export const captureException = (error: Error, extra?: Record<string, any>) => 
  sentry.captureException(error, extra);

export const captureMessage = (message: string, level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal', extra?: Record<string, any>) => 
  sentry.captureMessage(message, level, extra);

export const addBreadcrumb = (message: string, category?: string, level?: string, data?: Record<string, any>) => 
  sentry.addBreadcrumb(message, category, level, data);

export const setUser = (user: { id?: string; email?: string; [key: string]: any }) => 
  sentry.setUser(user);

export const setTag = (key: string, value: string) => 
  sentry.setTag(key, value);

export const setTags = (tags: Record<string, string>) => 
  sentry.setTags(tags);

export const setContext = (key: string, value: any) => 
  sentry.setContext(key, value);

export const configureForEdgeFunction = (functionName: string, request?: Request) => 
  sentry.configureForEdgeFunction(functionName, request);

export const withErrorCapture = <T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> => sentry.withErrorCapture(operation, operationName, context);

export default sentry;