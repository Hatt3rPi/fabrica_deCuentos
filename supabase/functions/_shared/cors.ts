/**
 * CORS Headers para Edge Functions
 * 
 * Configuración centralizada de headers CORS para todas las Edge Functions
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

export const secureHeaders = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Download-Options': 'noopen',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
}

export const protectedImageHeaders = {
  ...corsHeaders,
  ...secureHeaders,
  'Content-Disposition': 'inline',
}