# Integración con Sentry.io

## ✅ Estado de Implementación

Sentry está completamente configurado y funcional en La CuenteAI.

### 🔧 Componentes Implementados:

1. **Frontend Tracking** (`@sentry/react`)
2. **Source Maps** (`@sentry/vite-plugin`)
3. **Logger Integration** (automático)
4. **User Context** (automático con auth)
5. **Performance Monitoring** (activo)
6. **Session Replay** (10% de sesiones, 100% en errores)

## 🎯 Configuración

### Variables de Entorno Requeridas:

```env
# Sentry Configuration
VITE_SENTRY_DSN=https://5b605afc70c152cf32df6ee03964549e@o4509578325524480.ingest.us.sentry.io/4509578344333312
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# App Version (automático desde package.json)
VITE_APP_VERSION=1.0.0
```

### Configuración Actual:

- **Organización**: `customware`
- **Proyecto**: `lacuenteria`
- **Entornos**: `development`, `production`
- **Solo activo en producción**: ✅

## 📊 Características Implementadas

### 1. Error Tracking Automático

Todos los errores no manejados se envían automáticamente a Sentry con:
- Stack traces completos con source maps
- Contexto de usuario (ID, email)
- URL y navegación actual
- Breadcrumbs de acciones del usuario

### 2. Logger Integrado

El logger existente (`src/utils/logger.ts`) ahora incluye:

```typescript
// Errores automáticos a Sentry
logger.error("Error crítico", error, { context: "additional info" });

// API específicos
logger.apiError("/api/endpoint", error, requestData);

// Errores de usuario/UX
logger.userError("action_name", error, userContext);

// Warnings importantes
logger.warn("Warning message", additionalData);
```

### 3. Contexto de Usuario Automático

Se configura automáticamente cuando el usuario se autentica:
- User ID
- Email
- Created date
- Last sign in

### 4. Performance Monitoring

Trackea automáticamente:
- **Core Web Vitals** (LCP, FID, CLS)
- **Navigation timing**
- **Resource loading**
- **React component renders**

### 5. Session Replay

- **10%** de sesiones normales
- **100%** de sesiones con errores
- Privacidad: No captura texto sensible ni media

## 🧪 Testing

### Component de Testing (Solo Desarrollo)

En desarrollo, aparece un panel flotante con botones para probar:
- Error directo
- Error del logger
- Error de API
- Error de usuario
- Warning

### Verificación Manual:

1. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

2. **Usar los botones de test** en la esquina inferior derecha

3. **Verificar en Sentry Dashboard**:
   - Ir a [Sentry Dashboard](https://sentry.io/organizations/customware/projects/lacuenteria/)
   - Ver errores en tiempo real

## 🚀 Producción

### Build con Source Maps:

```bash
# Las variables de entorno deben estar configuradas
SENTRY_AUTH_TOKEN=your-token npm run build
```

### Deploy:

Los source maps se suben automáticamente a Sentry durante el build de producción.

## 📈 Métricas y Alertas

### Errores Tracked Automáticamente:

- **Frontend errors**: JavaScript exceptions
- **API errors**: Failed requests
- **User actions**: Form submissions, navigation
- **Performance issues**: Slow renders, network

### Información Capturada:

- **User context**: ID, email, session
- **Device info**: Browser, OS, screen size
- **Navigation**: URL history, route changes
- **Network**: API calls, response times
- **Custom**: Logger calls con context

## 🔧 Configuración Avanzada

### Filtros de Errores:

Ya configurado para ignorar:
- `Script error` (errores de CORS)
- `ResizeObserver loop limit exceeded`
- Otros errores conocidos irrelevantes

### Performance Sampling:

- **Desarrollo**: 100% de transacciones
- **Producción**: 10% de transacciones (para controlar costos)

### Replay Sampling:

- **Sesiones normales**: 10%
- **Sesiones con errores**: 100%

## 📚 Uso en el Código

### Error Handling Básico:

```typescript
try {
  await someApiCall();
} catch (error) {
  logger.apiError('/api/stories', error, { storyId: '123' });
}
```

### Contexto Personalizado:

```typescript
logger.sentryEvent('story_created', { 
  storyId: '123',
  characters: 2,
  pages: 8 
});
```

### Información de Usuario:

```typescript
// Se configura automáticamente en AuthContext
// Pero puede actualizarse manualmente:
setUserContext({
  id: user.id,
  email: user.email,
  plan: 'premium',
  stories_created: 5
});
```

## 🔍 Debugging

### Ver Errores Localmente:

Los errores siguen apareciendo en la consola del navegador en desarrollo.

### Verificar Configuración:

```typescript
// En consola del navegador (desarrollo)
console.log('Sentry enabled:', !import.meta.env.DEV);
```

### Source Maps:

Verificar que los stack traces en Sentry muestran el código original, no el minificado.

## 📋 Próximos Pasos

1. **Configurar Alertas**: En Sentry Dashboard
2. **Edge Functions**: Añadir Sentry a Supabase Edge Functions
3. **Custom Dashboards**: Crear dashboards específicos
4. **Integración con Slack**: Para notificaciones del equipo

## 🆘 Troubleshooting

### Source Maps no Funcionan:

- Verificar `SENTRY_AUTH_TOKEN`
- Verificar que el build es de producción
- Verificar permisos en Sentry

### Errores no Aparecen:

- Verificar que `enabled: import.meta.env.PROD` en `main.tsx`
- Verificar DSN correcto
- Verificar filtros en `beforeSend`

### Performance Issues:

- Reducir `tracesSampleRate` si es necesario
- Verificar que no hay bucles infinitos de logging