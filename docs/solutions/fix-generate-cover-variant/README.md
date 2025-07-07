# Solución: Fix Generate Cover Variant - RLS Permissions

## Resumen del Problema

Las variantes de portada no se generaban después de la generación exitosa de la portada principal. El issue raíz era un problema de permisos RLS (Row Level Security) en la tabla `prompts`.

## Análisis del Problema

### Síntomas Iniciales
- La función `generate-cover` funcionaba correctamente
- La función `generateCoverVariants` parecía no ejecutarse
- No se veían las 5 variantes de estilo en el paso de diseño

### Root Cause Analysis
Mediante debug logging se descubrió que:

1. **`generateCoverVariants` SÍ se ejecutaba** - El problema no era que no se llamara
2. **`promptService.getPromptsByTypes()` retornaba array vacío** - El frontend no podía obtener los prompts
3. **Políticas RLS restrictivas** - La tabla `prompts` solo permite acceso a administradores específicos:
   ```sql
   create policy "Admins read prompts" on prompts
   for select to authenticated
   using (auth.jwt() ->> 'email' in (
     'fabarca212@gmail.com',
     'lucianoalonso2000@gmail.com', 
     'javier2000asr@gmail.com'
   ));
   ```

### Arquitectura del Problema
- **Frontend**: Usaba cliente normal de Supabase (sin permisos para leer `prompts`)
- **Edge Functions**: Ya tenían acceso via `supabaseAdmin` con `SUPABASE_SERVICE_ROLE_KEY`
- **Contradicción**: Frontend intentaba obtener prompts que solo las Edge Functions podían leer

## Solución Implementada

### Cambios Principales

#### 1. Eliminación de Llamada a promptService desde Frontend
**Archivo**: `src/context/StoryContext.tsx`

**Antes:**
```typescript
const types = STYLE_MAP.map(s => s.type);
const prompts = await promptService.getPromptsByTypes(types);

// Initialize variant status only for styles with prompts
const initialVariantStatus: Record<string, 'generating'> = {};
STYLE_MAP.forEach(style => {
  if (prompts[style.type]) {
    initialVariantStatus[style.key] = 'generating';
  }
});

// Skip styles without prompts
await Promise.all(
  STYLE_MAP.map(async (style) => {
    const prompt = prompts[style.type];
    if (!prompt) return;
    // ... rest of logic
  })
);
```

**Después:**
```typescript
// NO NEED TO GET PROMPTS FROM FRONTEND - Edge Functions handle this directly
// Initialize all variant statuses as generating for all styles
const initialVariantStatus: Record<string, 'generating'> = {};
STYLE_MAP.forEach(style => {
  initialVariantStatus[style.key] = 'generating';
});

// Process all styles - Edge Functions will handle prompt access
await Promise.all(
  STYLE_MAP.map(async (style) => {
    // ... direct fetch to Edge Function
  })
);
```

#### 2. Normalización de URLs
**Archivo**: `src/utils/urlHelpers.ts` (nuevo)

```typescript
export function normalizeStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Convert internal Docker addresses to public URLs for local development
  if (url.includes('kong:8000')) {
    return url.replace('kong:8000', '127.0.0.1:54321');
  }
  
  return url;
}
```

#### 3. Debug Logging Agregado
Para facilitar troubleshooting futuro, se agregaron logs de debug en:
- `StoryContext.tsx`: Para rastrear flujo de generación de variantes
- `promptService.ts`: Para identificar problemas de acceso a prompts

### Flujo Corregido

1. **Frontend** llama a `generateCoverVariants(storyId, imageUrl)`
2. **Frontend** marca todos los estilos como `'generating'` inmediatamente
3. **Para cada estilo**, Frontend hace fetch directo a Edge Function `generate-cover-variant`
4. **Edge Function** obtiene prompts directamente usando `supabaseAdmin`
5. **Edge Function** genera la variante y la guarda en Storage
6. **Frontend** recibe URL y actualiza UI progresivamente

## Archivos Modificados

### Core Changes
- `src/context/StoryContext.tsx` - Eliminación de `promptService.getPromptsByTypes()`
- `src/utils/urlHelpers.ts` - Nueva utilidad para normalización de URLs
- `src/components/Wizard/steps/StoryStep.tsx` - Logging de debug agregado
- `src/services/promptService.ts` - Logging de debug agregado

### Edge Functions (verificación)
- `supabase/functions/generate-cover-variant/index.ts` - Confirmado que usa `supabaseAdmin`
- `supabase/functions/_shared/metrics.ts` - Confirmado cliente admin disponible

## Resultados

✅ **Generación de variantes funciona**: Las 5 variantes de estilo se generan correctamente
✅ **UI progresiva**: Las variantes aparecen una por una conforme se completan
✅ **No bloqueos**: No se esperan todas las variantes antes de mostrar resultados
✅ **Permisos respetados**: No se modificaron políticas RLS existentes
✅ **Arquitectura mejorada**: Frontend ya no intenta acceder a recursos restringidos

## Validación

### Pruebas Manuales Realizadas
1. ✅ Generación de historia completa
2. ✅ Generación de portada principal
3. ✅ Generación de las 5 variantes progresivamente
4. ✅ URLs normalizadas correctamente en desarrollo local
5. ✅ Fallback images funcionando correctamente

### Tests de Regresión Recomendados
```bash
npm run cypress:run --spec "cypress/e2e/flows/3_creacion_personaje.cy.js"
npm run test:complete-flow
```

## Consideraciones de Mantenimiento

### Debugging Futuro
- Los logs de debug pueden removerse en producción si no son necesarios
- La función `normalizeStorageUrl` es específica para desarrollo local con Docker

### Monitoreo
- Vigilar métricas de Edge Functions en `/admin/flujo`
- Verificar que las 5 variantes se generen consistentemente
- Monitorear tiempos de respuesta de `generate-cover-variant`

## Notas Técnicas

### Por Qué Esta Solución
1. **Respeta arquitectura existente**: No modifica políticas RLS críticas
2. **Separación de responsabilidades**: Frontend UI, Edge Functions datos
3. **Performance**: Eliminación de llamada innecesaria a base de datos
4. **Escalabilidad**: Edge Functions pueden manejar prompts más eficientemente

### Alternativas Consideradas y Descartadas
1. **Modificar políticas RLS**: ❌ Comprometería seguridad
2. **Crear nueva política pública**: ❌ Usuario específicamente pidió no crear nuevas políticas
3. **Usar service role en frontend**: ❌ Expondría credenciales sensibles

---

**Fecha**: 2025-07-07
**Desarrollador**: Claude Code
**Revisado**: Pending
**Estado**: ✅ Implementado y funcionando