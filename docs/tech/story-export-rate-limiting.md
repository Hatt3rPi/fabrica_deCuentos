# Edge Function: story-export - Manejo de Rate Limiting

## 📋 Descripción
Documentación técnica del sistema de manejo de rate limiting implementado en la Edge Function `story-export` para mitigar errores HTTP 429 de Browserless.io durante la generación de PDFs.

## 🎯 Funcionalidades
- **Retry Logic**: Reintentos automáticos con exponential backoff para errores 429
- **Sentry Integration**: Tracking específico de eventos de rate limiting
- **Fallback System**: Sistema de respaldo usando mock export cuando se agotan los reintentos
- **User Experience**: Mensajes específicos en UI para different tipos de fallo

## 📡 API

### Error Responses
```typescript
// Rate limiting detectado con fallback exitoso
{
  success: true,
  downloadUrl: "data:text/plain;charset=utf-8,CUENTO...",
  usedFallback: true,
  fallbackReason: "rate_limit"
}

// Error total sin posibilidad de fallback
{
  success: false,
  error: "Browserless.io rate limit exceeded after 3 attempts",
  usedFallback: true,
  fallbackReason: "rate_limit"
}
```

## 🔄 Flujo de Rate Limiting

### 1. Detección de Rate Limiting
```typescript
// En generatePDFFromHTML()
if (response.status === 429) {
  console.log(`[story-export] ⚠️ Rate limit detectado (429) en intento ${attemptNumber}`);
  
  // Log específico para Sentry
  addBreadcrumb({
    message: `Browserless.io rate limit - Attempt ${attemptNumber}/${maxAttempts}`,
    category: 'rate_limiting',
    level: 'warning',
    data: {
      attempt_number: attemptNumber,
      max_attempts: maxAttempts,
      response_status: response.status,
      story_id: storyId
    }
  });
}
```

### 2. Retry Logic con Exponential Backoff
```mermaid
graph TD
    A[Llamada a Browserless.io] --> B{Respuesta 429?}
    B -->|Sí| C{Intentos < 3?}
    B -->|No| G[Continuar normal]
    C -->|Sí| D[Calcular delay: 2^(intento-1) * 2s]
    C -->|No| E[Log error en Sentry]
    D --> F[Esperar delay]
    F --> A
    E --> H[Activar fallback]
    G --> I[PDF generado]
    H --> J[Mock export]
```

### 3. Configuración de Reintentos
- **Máximo intentos**: 3
- **Base delay**: 2000ms (2 segundos)
- **Delays**: 2s, 4s, 8s (exponential backoff) + jitter aleatorio (0-1s)
- **Jitter**: 0-1000ms aleatorio para evitar thundering herd
- **Total tiempo máximo**: ~15 segundos (incluyendo jitter)

## 🗄️ Dependencias

### External APIs
- **Browserless.io**: Servicio de generación de PDF con rate limiting
- **Sentry**: Tracking de errores y métricas de rate limiting

### Shared Utilities
- `_shared/sentry.ts` - addBreadcrumb, setTags, captureException
- `_shared/metrics.ts` - logPromptMetric para tracking de errores

## ⚡ Performance

### Métricas de Rate Limiting
- **Tiempo base por intento**: 2-8 segundos
- **Tiempo máximo con reintentos**: ~14 segundos
- **Fallback time**: 1 segundo (mock generation)

### Optimizaciones Implementadas
- Retry solo para errores 429 específicos
- Exponential backoff con jitter aleatorio para evitar thundering herd
- Fallback inmediato tras agotar reintentos
- Logging detallado para debugging y análisis de timing

## 📊 Logging y Métricas

### Métricas de Sentry
```typescript
// Tags específicos para rate limiting
setTags({
  'browserless.rate_limited': 'true',
  'browserless.attempts': maxAttempts.toString(),
  'error.type': 'rate_limiting'
});

// Breadcrumbs para tracking del proceso
addBreadcrumb({
  message: 'All retry attempts exhausted for rate limiting',
  category: 'rate_limiting',
  level: 'error',
  data: {
    total_attempts: maxAttempts,
    final_status: response.status,
    story_id: storyId
  }
});
```

### Logs de Debugging
```typescript
console.log(`[story-export] 🔄 Intento ${attemptNumber}/${maxAttempts} - Browserless.io API`);
console.log(`[story-export] ⏳ Esperando ${Math.round(delay)}ms (base: ${baseDelayMs}ms + jitter: ${Math.round(jitter)}ms) antes del siguiente intento...`);
console.log('[StoryService] Rate limiting detected, falling back to mock export...');
```

## 🧪 Testing

### Simulación de Rate Limiting
```bash
# Simular error 429 en Browserless.io
# No hay forma directa de testing, se debe monitorear en producción

# Verificar logs en Supabase
supabase functions logs story-export --follow
```

### Verificación de Fallback
```typescript
// En storyService.ts - verificar detección
const isRateLimitError = error instanceof Error && 
  (error.message.includes('rate limit') || error.message.includes('429'));

// Verificar que fallbackReason se setea correctamente
if (result.usedFallback && result.fallbackReason === 'rate_limit') {
  console.log('✅ Rate limiting manejado correctamente');
}
```

## 🚀 Deployment

### Environment Variables
```env
BROWSERLESS_TOKEN=required_for_pdf_generation
SENTRY_DSN=required_for_error_tracking
```

### Configuración de Rate Limiting
- No requiere configuración adicional
- Los límites son impuestos por Browserless.io
- El retry logic está hardcodeado en la función

## 🔧 Configuration

### Parámetros Configurables
```typescript
const maxAttempts = 3;           // Máximo número de reintentos
const baseDelay = 2000;          // Delay base en milisegundos
const jitter = Math.random() * 1000; // Jitter aleatorio 0-1s
// delay = (baseDelay * Math.pow(2, attemptNumber - 1)) + jitter
```

### Sentry Configuration
```typescript
// En _shared/sentry.ts
configureForEdgeFunction('story-export', req);
setUser({ id: userId });
setTags({
  'story.id': story_id,
  'export.format': format,
  'export.save_to_library': save_to_library.toString()
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Issue**: Error 429 persistente después de implementar retry logic
   - **Cause**: Browserless.io está bajo alta demanda o plan de suscripción limitado
   - **Solution**: Verificar límites del plan en Browserless.io, considerar upgrade o dispersar carga

2. **Issue**: Thundering Herd - múltiples requests se sincronizan creando picos de carga
   - **Cause**: Sin jitter, todos los reintentos se ejecutan al mismo tiempo
   - **Solution**: ✅ **RESUELTO** - Implementado jitter aleatorio de 0-1s en cada reintento
   - **Prevention**: El jitter rompe la sincronización entre requests concurrentes

3. **Issue**: Fallback mock export no se activa
   - **Cause**: Error de detección en storyService.ts
   - **Solution**: Verificar que error message incluya 'rate limit' o '429'

4. **Issue**: Usuario no recibe feedback adecuado durante rate limiting
   - **Cause**: OverlayLoader no está usando variant correcto
   - **Solution**: Pasar `variant="rate_limit"` al componente OverlayLoader

### Debugging
- Verificar logs de Sentry para tags 'browserless.rate_limited'
- Comprobar métricas de tiempo de respuesta en dashboard
- Revisar breadcrumbs de rate limiting en eventos de error
- Monitorear llamadas activas en `/admin/flujo`

## 📝 Monitoring

### Métricas Clave
- **Rate limit frequency**: Frecuencia de errores 429
- **Retry success rate**: Porcentaje de éxito tras reintentos
- **Fallback usage**: Porcentaje de casos que usan mock export
- **User experience**: Tiempo total desde error hasta resolución

### Alertas Recomendadas
- Alerta si rate limiting > 10% de requests en 1 hora
- Alerta si fallback usage > 20% en 1 hora
- Alerta si tiempo promedio de resolución > 30 segundos

## 🔄 Future Improvements

### Posibles Optimizaciones
1. **Dynamic Retry Strategy**: Ajustar delays basado en headers de rate limiting
2. **Circuit Breaker**: Pausar requests por períodos cuando rate limiting es alto
3. **Alternative PDF Providers**: Implementar múltiples proveedores como backup
4. **Queue System**: Implementar cola para requests durante alta demanda

### Monitoring Enhancements
1. **Dashboard específico**: Panel para métricas de rate limiting
2. **Predictive alerts**: Alertas basadas en tendencias de uso
3. **Cost tracking**: Seguimiento de costos por fallback usage

## 📋 Changelog
- **v1.0.0** (2025-01-02): Implementación inicial de retry logic con exponential backoff
- **v1.0.1** (2025-01-02): Agregada detección específica de rate limiting en storyService
- **v1.0.2** (2025-01-02): Implementado fallback inteligente con información de contexto
- **v1.0.3** (2025-01-02): Mejorados mensajes de UI con OverlayLoader variants
- **v1.0.4** (2025-01-02): **CRÍTICO** - Implementado jitter aleatorio para prevenir thundering herd