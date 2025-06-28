# Configuración de Variables de Ambiente

## 🎯 Overview

Este documento explica cómo configurar correctamente las variables de ambiente para **desarrollo**, **staging** y **producción** en La CuenterIA, especialmente para el sistema CORS inteligente.

## 📁 Archivos de Configuración

### Desarrollo Local
```bash
# .env.local (no commitear)
ENVIRONMENT=development
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=local-anon-key
```

### Desarrollo Remoto
```bash
# .env.development
ENVIRONMENT=development
VITE_SUPABASE_URL=https://ogegdctdniijmublbmgy.supabase.co
VITE_SUPABASE_ANON_KEY=development-anon-key
```

### Producción
```bash
# .env.production
ENVIRONMENT=production
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key
ALLOWED_ORIGINS=https://lacuenteria.cl,https://www.lacuenteria.cl
```

## 🔧 Sistema CORS Inteligente

### Detección Automática de Ambiente

El sistema detecta el ambiente usando múltiples criterios:

```typescript
export function isProduction(): boolean {
  const environment = Deno.env.get('ENVIRONMENT');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  // 1. Variable explícita
  if (environment === 'production' || environment === 'prod') {
    return true;
  }
  
  // 2. URL contiene .supabase.co (producción)
  if (supabaseUrl?.includes('.supabase.co')) {
    return true;
  }
  
  // 3. No es localhost (producción)
  if (supabaseUrl && !supabaseUrl.includes('localhost') && !supabaseUrl.includes('127.0.0.1')) {
    return true;
  }
  
  return false;
}
```

### Origins Automáticos por Ambiente

```typescript
export function getAllowedOrigins(): string[] {
  if (isProduction()) {
    // Configurables via ALLOWED_ORIGINS
    const prodOrigins = Deno.env.get('ALLOWED_ORIGINS');
    if (prodOrigins) {
      return prodOrigins.split(',').map(origin => origin.trim());
    }
    
    // Fallback seguro
    return [
      'https://lacuenteria.cl',
      'https://www.lacuenteria.cl',
      'https://app.lacuenteria.cl'
    ];
  } else {
    // Desarrollo - Soporte múltiples puertos
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
```

## 🚀 Configuración por Ambiente

### 1. Desarrollo Local (Supabase Local)

```bash
# .env.local
ENVIRONMENT=development
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=local-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=local-service-role-key
```

**Características**:
- ✅ Sin problemas de cookies Cloudflare
- ✅ CORS permisivo para debugging
- ✅ Latencia mínima
- ✅ Sin límites de rate limiting

### 2. Desarrollo Remoto (Supabase Cloud)

```bash
# .env.development  
ENVIRONMENT=development
VITE_SUPABASE_URL=https://ogegdctdniijmublbmgy.supabase.co
VITE_SUPABASE_ANON_KEY=development-anon-key
```

**Características**:
- ⚠️ Cookies Cloudflare (solucionado con CORS inteligente)
- ✅ CORS optimizado para localhost
- ✅ Datos de producción para testing
- ✅ Edge Functions reales

### 3. Staging

```bash
# .env.staging
ENVIRONMENT=staging
VITE_SUPABASE_URL=https://staging-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
ALLOWED_ORIGINS=https://staging.lacuenteria.cl,https://preview.lacuenteria.cl
```

**Características**:
- ✅ Configuración idéntica a producción
- ✅ CORS restrictivo pero con origins de staging
- ✅ Testing de features antes de release
- ✅ Datos aislados de producción

### 4. Producción

```bash
# .env.production
ENVIRONMENT=production
VITE_SUPABASE_URL=https://prod-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key
ALLOWED_ORIGINS=https://lacuenteria.cl,https://www.lacuenteria.cl
VITE_SUPABASE_REDIRECT_URL=https://lacuenteria.cl
```

**Características**:
- 🔒 CORS restrictivo (solo dominios autorizados)
- 🔒 Sin headers de debugging
- 🔒 Rate limiting habilitado
- 🔒 Logs mínimos en console

## 🔒 Seguridad por Ambiente

### Headers CORS por Ambiente

#### Desarrollo
```typescript
{
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': [
    'authorization', 'x-client-info', 'apikey', 'content-type',
    'x-supabase-auth-token', 'cache-control'  // ← Headers extra para debugging
  ]
}
```

#### Producción
```typescript
{
  'Access-Control-Allow-Origin': 'https://lacuenteria.cl',
  'Access-Control-Allow-Credentials': 'true', 
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // ← Sin PATCH
  'Access-Control-Allow-Headers': [
    'authorization', 'x-client-info', 'apikey', 'content-type'  // ← Headers mínimos
  ]
}
```

## 📋 Checklist de Deployment

### Pre-Deployment
- [ ] Configurar `.env.production` con valores correctos
- [ ] Verificar `ALLOWED_ORIGINS` incluye solo dominios de producción
- [ ] Configurar `ENVIRONMENT=production`
- [ ] Remover variables de debugging

### Post-Deployment
- [ ] Verificar detección de ambiente: `isProduction()` retorna `true`
- [ ] Confirmar CORS headers restrictivos en Network tab
- [ ] Validar que no hay warnings de cookies en producción
- [ ] Probar autenticación cross-origin

## 🔧 Troubleshooting

### Problema: CORS errors en producción
**Solución**: Verificar que `ALLOWED_ORIGINS` incluye el dominio exacto

### Problema: Cookies rechazadas en desarrollo
**Solución**: Confirmar que usa `getSmartCorsHeaders()` en lugar de hardcoded

### Problema: Edge Functions fallan después de deployment
**Solución**: Verificar variables de ambiente en Supabase Dashboard

### Problema: Detección de ambiente incorrecta
**Solución**: Revisar logs de `isProduction()` y ajustar criterios

## 📊 Monitoreo

### Variables a Monitorear

```typescript
// Logging para debugging
console.log('Environment Detection:', {
  ENVIRONMENT: Deno.env.get('ENVIRONMENT'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  isProduction: isProduction(),
  allowedOrigins: getAllowedOrigins()
});
```

### Alertas Recomendadas
- CORS errors > 5% de requests
- Origins no autorizados detectados
- Cookies Cloudflare rechazadas
- Edge Functions con alta latencia

---

**Resultado**: Sistema CORS que se adapta automáticamente al ambiente, eliminando configuración manual y reduciendo errores de deployment.