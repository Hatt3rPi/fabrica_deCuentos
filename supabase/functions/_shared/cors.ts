/**
 * Configuración centralizada de CORS para Edge Functions
 * Soluciona problemas de cookies __cf_bm de Cloudflare
 */

export interface CorsOptions {
  origin?: string | string[];
  credentials?: boolean;
  methods?: string[];
  headers?: string[];
}

/**
 * Detecta el ambiente de ejecución automáticamente
 * Prioriza variables explícitas sobre detección automática
 */
export function isProduction(): boolean {
  const environment = Deno.env.get('ENVIRONMENT');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  // 1. Variable explícita de ambiente tiene máxima prioridad
  if (environment === 'production' || environment === 'prod') {
    return true;
  }
  
  // 2. Si está explícitamente en desarrollo, respetarlo
  if (environment === 'development' || environment === 'dev') {
    return false;
  }
  
  // 3. Detectar por URL de Supabase solo si no hay variable ENVIRONMENT
  if (!environment && supabaseUrl?.includes('.supabase.co')) {
    return true;
  }
  
  // 4. Detectar por ausencia de localhost solo si no hay variable ENVIRONMENT
  if (!environment && supabaseUrl && !supabaseUrl.includes('localhost') && !supabaseUrl.includes('127.0.0.1')) {
    return true;
  }
  
  // 5. Por defecto, asumir desarrollo si no hay indicadores claros
  return false;
}

/**
 * Obtiene los origins permitidos para el ambiente actual
 */
export function getAllowedOrigins(): string[] {
  if (isProduction()) {
    // Origins de producción - configurables via variables de ambiente
    const prodOrigins = Deno.env.get('ALLOWED_ORIGINS');
    if (prodOrigins) {
      return prodOrigins.split(',').map(origin => origin.trim());
    }
    
    // Fallback: origins de producción conocidos
    return [
      'https://lacuenteria.cl',
      'https://www.lacuenteria.cl',
      'https://app.lacuenteria.cl'
    ];
  } else {
    // Origins de desarrollo
    return [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://localhost:5173',
      'https://127.0.0.1:5173'
    ];
  }
}

/**
 * Genera headers CORS apropiados basados en el request y opciones
 */
export function getCorsHeaders(request: Request, options: CorsOptions = {}): Record<string, string> {
  const {
    origin = '*',
    credentials = false,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['authorization', 'x-client-info', 'apikey', 'content-type']
  } = options;

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': headers.join(', ')
  };

  // Manejo inteligente del origin
  if (Array.isArray(origin)) {
    const requestOrigin = request.headers.get('origin');
    if (requestOrigin && origin.includes(requestOrigin)) {
      corsHeaders['Access-Control-Allow-Origin'] = requestOrigin;
    } else {
      corsHeaders['Access-Control-Allow-Origin'] = origin[0];
    }
  } else if (origin === '*' && credentials) {
    // Si credentials es true, no podemos usar '*'
    const requestOrigin = request.headers.get('origin');
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin || 'https://localhost:5173';
  } else {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  // Configuración de credentials para solucionar problema de cookies
  if (credentials) {
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  // Headers adicionales para mejorar compatibilidad con Cloudflare
  corsHeaders['Access-Control-Max-Age'] = '86400'; // 24 horas
  corsHeaders['Vary'] = 'Origin';

  return corsHeaders;
}

/**
 * Headers CORS automáticos basados en el ambiente detectado
 * Optimizado para desarrollo y seguro para producción
 */
export function getSmartCorsHeaders(request: Request): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  
  if (isProduction()) {
    // Configuración restrictiva para producción
    return getCorsHeaders(request, {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: [
        'authorization',
        'x-client-info',
        'apikey', 
        'content-type'
      ]
    });
  } else {
    // Configuración permisiva para desarrollo
    return getCorsHeaders(request, {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      headers: [
        'authorization',
        'x-client-info', 
        'apikey',
        'content-type',
        'x-supabase-auth-token',
        'cache-control'
      ]
    });
  }
}

/**
 * Headers CORS para desarrollo local (deprecated - usar getSmartCorsHeaders)
 * @deprecated Use getSmartCorsHeaders() instead
 */
export function getDevCorsHeaders(request: Request): Record<string, string> {
  return getSmartCorsHeaders(request);
}

/**
 * Headers CORS para producción (deprecated - usar getSmartCorsHeaders)
 * @deprecated Use getSmartCorsHeaders() instead
 */
export function getProdCorsHeaders(request: Request, allowedOrigins: string[]): Record<string, string> {
  return getSmartCorsHeaders(request);
}

/**
 * Maneja requests OPTIONS de preflight con detección automática de ambiente
 */
export function handleCorsPreflightResponse(request: Request): Response {
  const corsHeaders = getSmartCorsHeaders(request);
  return new Response('ok', { 
    status: 200,
    headers: corsHeaders 
  });
}

/**
 * Wrapper para responses con CORS apropiado y detección automática de ambiente
 */
export function corsResponse(
  data: any, 
  request: Request, 
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers: additionalHeaders = {} } = options;
  const corsHeaders = getSmartCorsHeaders(request);
  
  const allHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  return new Response(
    JSON.stringify(data),
    { status, headers: allHeaders }
  );
}

/**
 * Wrapper para errores con CORS apropiado y detección automática de ambiente
 */
export function corsErrorResponse(
  error: string | Error,
  request: Request,
  status: number = 500
): Response {
  const message = error instanceof Error ? error.message : error;
  return corsResponse(
    { error: message },
    request,
    { status }
  );
}