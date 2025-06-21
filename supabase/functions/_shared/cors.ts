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
 * Headers CORS para desarrollo local
 * Optimizado para localhost y evitar problemas de cookies Cloudflare
 */
export function getDevCorsHeaders(request: Request): Record<string, string> {
  return getCorsHeaders(request, {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ],
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

/**
 * Headers CORS para producción
 * Configuración segura para ambiente productivo
 */
export function getProdCorsHeaders(request: Request, allowedOrigins: string[]): Record<string, string> {
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
}

/**
 * Maneja requests OPTIONS de preflight
 */
export function handleCorsPreflightResponse(request: Request): Response {
  const corsHeaders = getDevCorsHeaders(request);
  return new Response('ok', { 
    status: 200,
    headers: corsHeaders 
  });
}

/**
 * Wrapper para responses con CORS apropiado
 */
export function corsResponse(
  data: any, 
  request: Request, 
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers: additionalHeaders = {} } = options;
  const corsHeaders = getDevCorsHeaders(request);
  
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
 * Wrapper para errores con CORS apropiado
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