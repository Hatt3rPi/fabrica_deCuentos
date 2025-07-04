# Sistema de Logging Detallado para Flujo Post-Pago

## Resumen

Se implementó un sistema de logging detallado con Sentry siguiendo los estándares existentes del proyecto para garantizar monitoreo completo del flujo post-pago crítico.

## 🎯 Objetivos Cumplidos

### Problemas Identificados por Consenso
El análisis de consenso identificó como **riesgo crítico** la falta de logging detallado:
- "Nuevos puntos de fallo: Triggers, edge functions, servicio externo"
- "Fallos silenciosos: Especialmente triggers que no invocan functions"
- "ACCIÓN REQUERIDA: Logging y monitoreo detallado es IMPERATIVO"

### Solución Implementada
✅ **Sistema completo de logging** siguiendo estándares de Sentry existentes
✅ **Monitoreo de puntos críticos** identificados en consenso  
✅ **Alertas proactivas** para fallos de email y triggers
✅ **Performance tracking** para optimización continua

## 🔧 Implementación Técnica

### 1. Edge Function: `send-purchase-confirmation`

**Configuración Completa:**
```typescript
// Inicialización estándar
configureForEdgeFunction('send-purchase-confirmation', req)
const logger = new EdgeFunctionLogger('send-purchase-confirmation')

// Contexto enriquecido  
logger.setContext('order_id', order_id)
setTags({ 'order.id': order_id })
setContext('user', { email: orderData.user_email })
```

**Operaciones Monitoreadas:**
- ✅ **Validación de entrada** con logging de errores de parsing
- ✅ **Consulta de BD** con `withErrorCapture` wrapper
- ✅ **Generación de template** con métricas de tamaño
- ✅ **Envío de email** con status de Resend API
- ✅ **Alertas críticas** para fallos de email (`critical: true`)

**Logs Estructurados:**
```typescript
// Inicio operación
logger.startOperation('send_purchase_confirmation_email')

// Estados detallados
logger.info('Processing purchase confirmation', { order_id })
logger.debug('Fetching order data from database', { order_id })
logger.info('Order data fetched successfully', { 
  order_id, user_email, items_count, total_amount 
})

// Métricas de performance
logger.completeOperation('send_purchase_confirmation_email', duration)
logger.info('Purchase confirmation email sent successfully', {
  order_id, email_id, recipient, duration_ms
})
```

### 2. Edge Function: `generate-receipt-pdf`

**Configuración Idéntica:**
- Misma estructura de inicialización y contexto
- `withErrorCapture` para operaciones críticas de BD
- Métricas de tamaño de HTML generado
- Performance tracking completo

**Datos Específicos Capturados:**
```typescript
logger.info('Receipt HTML generated successfully', {
  order_id,
  html_length: receiptHtml.length,
  duration_ms: operationDuration
})

setContext('receipt_result', {
  html_length: receiptHtml.length,
  success: true,
  duration_ms: operationDuration
})
```

### 3. Trigger de Base de Datos: `send_purchase_confirmation_email()`

**Logging Estructurado:**
```sql
-- Contexto enriquecido JSON
log_context := jsonb_build_object(
  'order_id', NEW.id,
  'user_id', NEW.user_id,
  'total_amount', NEW.total_amount,
  'payment_method', NEW.payment_method,
  'trigger_timestamp', NOW()
);

-- Logs categorizados con prefijo identificable
RAISE LOG '[PURCHASE_CONFIRMATION_TRIGGER] Starting email notification for order %'
RAISE LOG '[PURCHASE_CONFIRMATION_TRIGGER] HTTP call completed for order %'
RAISE WARNING '[PURCHASE_CONFIRMATION_TRIGGER] HTTP call failed for order %'
```

**Monitoreo de HTTP Calls:**
- **Verificación de status**: Códigos 2xx considerados exitosos
- **Timeout incrementado**: 10 segundos para mayor estabilidad
- **Captura de respuesta**: Headers y body para debugging
- **Manejo robusto**: No falla flujo principal si email falla

**Información Capturada:**
- ✅ **order_id**: Identificador único de transacción
- ✅ **http_status**: Status code de edge function
- ✅ **response_body**: Respuesta completa para debugging
- ✅ **error_code**: SQLSTATE para clasificación de errores
- ✅ **trigger_context**: Datos completos de orden

## 🚨 Sistema de Alertas Configurado

### Alertas Críticas Post-Pago

**1. Fallos de Email de Confirmación (CRÍTICO)**
```javascript
tags.critical = 'true'
AND function.name = 'send-purchase-confirmation'  
AND level = 'error'
```

**2. Triggers de BD Fallando (ALTO)**
```sql
message CONTAINS '[PURCHASE_CONFIRMATION_TRIGGER]'
AND level IN ['WARNING', 'ERROR']
```

**3. Latencia Alta en Post-Pago (MEDIO)**
```javascript
elapsed > 10000
AND function.name IN ['send-purchase-confirmation', 'generate-receipt-pdf']
```

### Alertas de Performance

**Degradación de Performance:**
```javascript
elapsed > 30000
AND function.name IN ['send-purchase-confirmation', 'generate-receipt-pdf']
```

**Rate Limiting de Resend:**
```javascript
error.message CONTAINS 'rate limit'
AND function.name = 'send-purchase-confirmation'
```

## 📊 Métricas y Observabilidad

### Tags Estructurados para Filtering

**Tags de Orden:**
- `order.id`: ID único de la orden
- `order.items_count`: Número de items comprados
- `user.email`: Email del comprador

**Tags de Operación:**
- `operation`: Nombre de operación específica
- `function`: Nombre de edge function
- `critical`: true para errores que requieren intervención inmediata

**Tags de Performance:**
- `duration_ms`: Duración de operación en milisegundos
- `html_length`: Tamaño de templates generados

### Contexto Enriquecido

**Contexto de Usuario:**
```typescript
setContext('user', { 
  email: orderData.user_email 
})
```

**Contexto de Operación:**
```typescript
setContext('email_result', {
  email_id: emailData?.id,
  success: true,
  duration_ms: operationDuration
})
```

**Contexto de Trigger:**
```sql
log_context := jsonb_build_object(
  'order_id', NEW.id,
  'user_id', NEW.user_id,
  'total_amount', NEW.total_amount,
  'payment_method', NEW.payment_method
);
```

## 🔍 Debugging y Troubleshooting

### Breadcrumbs Implementados
- **Inicio de operación** con contexto completo
- **Pasos de validación** con datos de entrada
- **Consultas de BD** con tiempos de respuesta
- **Llamadas externas** (Resend API) con status
- **Finalización** con métricas de éxito

### Error Categorization

**Errores de Validación:**
- JSON malformado en requests
- order_id faltante o inválido
- Datos de orden no encontrados

**Errores de BD:**
- Timeouts en consultas complejas
- Permisos RLS incorrectos
- Datos inconsistentes

**Errores de Servicios Externos:**
- Fallos de Resend API
- Rate limiting
- Timeouts de red

**Errores de Sistema:**
- Exceptions no manejadas
- Memory leaks
- Configuración incorrecta

## 📈 Beneficios Operacionales

### Visibilidad Completa
- **100% de coverage** en flujo post-pago crítico
- **Trazabilidad end-to-end** desde trigger DB hasta email entregado
- **Métricas de performance** para optimización proactiva

### Detección Proactiva
- **Fallos silenciosos eliminados** mediante logging exhaustivo
- **Alertas inmediatas** para problemas críticos de UX
- **Trending de performance** para prevenir degradación

### Debugging Eficiente
- **Contexto completo** en cada error reportado
- **Breadcrumbs detallados** para reproducir flujos
- **Correlación automática** entre eventos relacionados

### Compliance y Auditoría
- **Logs estructurados** para análisis automatizado
- **Retención configurable** según políticas de empresa
- **Trazabilidad completa** para auditorías de transacciones

## 🚀 Próximos Pasos

### Monitoreo Avanzado
1. **Dashboards específicos** para métricas post-pago
2. **SLA tracking** para tiempos de email delivery
3. **Alertas predictivas** basadas en tendencias

### Automatización
1. **Auto-healing** para errores temporales conocidos
2. **Escalation automática** para errores críticos
3. **Reports automatizados** de health del sistema

La implementación proporciona la base sólida requerida por el consenso para monitoreo de producción del flujo post-pago crítico.