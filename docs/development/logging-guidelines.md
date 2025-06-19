# Logging Guidelines - La CuenteAI

Esta documentación establece las convenciones y mejores prácticas para logging en el proyecto La CuenteAI.

## ⚡ Quick Start

```typescript
import { logger, wizardLogger, autosaveLogger } from '../utils/logger';

// ✅ Correcto - solo en desarrollo
logger.debug('Estado del wizard actualizado');

// ✅ Correcto - siempre activo
logger.error('Error crítico:', error);

// ❌ Incorrecto - evitar console.log directo
console.log('Debug info');
```

## 🎯 Principios

1. **Solo errores y warnings en producción**
2. **Logs de desarrollo solo con `import.meta.env.DEV`**
3. **Usar logger centralizado en lugar de console.log directo**
4. **Nunca loggear información sensible**

## 📚 API del Logger

### Logger Principal

```typescript
import { logger } from '../utils/logger';

// Solo en desarrollo
logger.debug('Información detallada de debugging');
logger.info('Información general del sistema');

// Siempre activos
logger.warn('Advertencia que no rompe funcionalidad');
logger.error('Error crítico o excepción');

// Condicional personalizado
logger.conditional(someCondition, 'Mensaje solo si condición es true');
```

### Loggers Especializados

#### Wizard Logger
```typescript
import { wizardLogger } from '../utils/logger';

// Solo en desarrollo
wizardLogger.step('updateStoryTitle', { title: 'Mi Cuento' });

// Siempre activo
wizardLogger.error('saveWizardState', new Error('Save failed'));
```

#### Autosave Logger
```typescript
import { autosaveLogger } from '../utils/logger';

// Solo en desarrollo
autosaveLogger.start('story-123');
autosaveLogger.success();

// Siempre activo
autosaveLogger.error(new Error('Failed to save'));
```

#### Performance Logger
```typescript
import { perfLogger } from '../utils/logger';

// Solo en desarrollo
perfLogger.start('image-generation');
// ... operación costosa
perfLogger.end('image-generation');
```

## 🔧 Configuración ESLint

El proyecto incluye una regla ESLint que advierte sobre el uso directo de `console.log`:

```javascript
// eslint.config.js
rules: {
  'no-console': ['warn', { 
    allow: ['warn', 'error'] 
  }],
}
```

## 📋 Niveles de Log

| Nivel | Cuándo usar | Producción | Desarrollo |
|-------|-------------|------------|------------|
| `debug` | Información detallada de flujo | ❌ No | ✅ Sí |
| `info` | Información general | ❌ No | ✅ Sí |
| `warn` | Advertencias no críticas | ✅ Sí | ✅ Sí |
| `error` | Errores y excepciones | ✅ Sí | ✅ Sí |

## 🚨 Qué NO loggear

### ❌ Información Sensible
```typescript
// NUNCA hacer esto
logger.debug('User password:', userPassword);
logger.debug('API key:', process.env.SECRET_KEY);
logger.debug('User email:', user.email);
```

### ❌ Datos Personales
```typescript
// Evitar
logger.debug('User data:', userData);

// Mejor
logger.debug('User data loaded successfully');
```

### ❌ Console.log directo
```typescript
// Evitar
console.log('Debug info');

// Usar
logger.debug('Debug info');
```

## ✅ Mejores Prácticas

### 1. Contexto Claro
```typescript
// ❌ Poco claro
logger.debug('Updated');

// ✅ Contexto claro
logger.debug('Story title updated', { storyId, newTitle });
```

### 2. Estructura Consistente
```typescript
// ✅ Para operaciones
logger.debug('Starting image generation', { pageId, storyId });
// ... operación
logger.debug('Image generation completed', { pageId, imageUrl });

// ✅ Para errores
logger.error('Failed to generate image', { pageId, error: error.message });
```

### 3. Agrupación Lógica
```typescript
// ✅ Agrupar logs relacionados
logger.group.start('Parallel Image Generation');
pages.forEach(page => {
  logger.debug(`Processing page ${page.number}`);
});
logger.group.end();
```

## 🔄 Migration Guide

### Antes (console.log directo)
```typescript
console.log('🏷️ [WizardContext] updateStoryTitle called with:', title);
console.error('Error generating image:', error);
```

### Después (logger centralizado)
```typescript
wizardLogger.step('updateStoryTitle', { title });
logger.error('Error generating image:', error);
```

## 🧪 Testing

En tests, el logger automáticamente se deshabilita en modo no-desarrollo:

```typescript
// En tests, estos logs no aparecerán
logger.debug('Test data');
logger.info('Test completed');

// Estos sí aparecerán
logger.error('Test error');
logger.warn('Test warning');
```

## 📊 Performance

- **Desarrollo**: Todos los logs están activos
- **Producción**: Solo `warn` y `error`, otros son no-ops (muy rápidos)
- **Bundle size**: Logs de desarrollo se eliminan en build por tree-shaking

## 🔗 Enlaces Relacionados

- [Issue #185 - Console Logs Cleanup](https://github.com/Customware-cl/Lacuenteria/issues/185)
- [ESLint no-console rule](https://eslint.org/docs/rules/no-console)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)