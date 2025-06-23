# Solución: Error al Editar Prompts de Portada en Vista Previa

## Problema Reportado

Al editar el prompt de la portada (página 1) en la vista previa y hacer click en "Regenerar", aparecía el siguiente error en la edge function `generate-cover`:

```
Error: Unsupported content type: 'application/json'. This API method only accepts 'multipart/form-data' requests, but you specified the header 'Content-Type: application/json'.
```

Además, la imagen pestañeaba cada vez que se escribía un carácter en el editor de prompt.

## Análisis de la Causa Raíz

### Diferencia entre Generación Inicial vs Edición de Prompts

**Generación inicial (que funcionaba correctamente):**
- Se ejecuta desde `StoryContext.tsx` 
- Envía parámetros completos: `story_id`, `visual_style`, `color_palette`
- La edge function recibe toda la información necesaria

**Edición de prompts (que fallaba):**
- Se ejecuta desde `storyService.generateCoverImage()`
- Solo enviaba: `{ story_id: storyId }`
- La edge function esperaba `visual_style` y `color_palette` pero recibía `undefined`

### Logs que confirmaron el problema

En los logs de la edge function se veía:
```
Estilo visual: No especificado
Paleta de colores: No especificada
```

Esto confirmó que la edge function no estaba recibiendo los parámetros de diseño necesarios.

## Solución Implementada

### Principio de Diseño
- **NO modificar edge functions** que funcionan correctamente en producción
- **Modificar solo el frontend** para enviar los parámetros requeridos

### Cambios Realizados

#### 1. `src/services/storyService.ts`
```typescript
// Antes: Solo enviaba story_id
body: JSON.stringify({ story_id: storyId })

// Después: Consulta y envía parámetros de diseño
const { data: design } = await supabase
  .from('story_designs')
  .select('visual_style, color_palette')
  .eq('story_id', storyId)
  .maybeSingle();

body: JSON.stringify({ 
  story_id: storyId,
  visual_style: design?.visual_style,
  color_palette: design?.color_palette
})
```

#### 2. `src/context/WizardContext.tsx`
- Actualizada función `generatePageImage` para aceptar `customPrompt` opcional
- Actualiza el estado local con el nuevo prompt cuando se proporciona

#### 3. `src/components/Wizard/steps/PreviewStep.tsx`
- **Pasar prompt personalizado**: `await generatePageImage(pageId, promptText)`
- **Eliminar parpadeo**: Remover `Date.now()` del `key` y `src` de la imagen

```typescript
// Antes: Causaba parpadeo
<img key={`${id}-${url}-${Date.now()}`} src={`${url}?t=${Date.now()}`} />

// Después: Sin parpadeo
<img key={`${id}-${url}`} src={url || '/placeholder-image.png'} />
```

## Resultados

1. **Edición de prompts funciona**: Los parámetros de diseño se envían correctamente
2. **Prompts se guardan**: Se actualiza la base de datos antes de regenerar
3. **Sin parpadeo**: La imagen no se re-renderiza al escribir
4. **Retrocompatibilidad**: La generación inicial sigue funcionando sin cambios

## Archivos Modificados

- `src/services/storyService.ts`: Consultar diseño antes de llamar edge function
- `src/context/WizardContext.tsx`: Soporte para prompts personalizados
- `src/components/Wizard/steps/PreviewStep.tsx`: Eliminar parpadeo y pasar prompt

## Testing

Para verificar la corrección:

1. **Ir a vista previa** de un cuento existente
2. **Click en "Editar prompt de esta página"** (portada o página regular)
3. **Modificar el prompt** y escribir varios caracteres
4. **Verificar**: No hay parpadeo al escribir
5. **Click en "Regenerar"**
6. **Verificar**: 
   - No aparece error en los logs
   - La imagen se regenera correctamente
   - El prompt personalizado se mantiene

## Notas Técnicas

- La edge function `generate-cover` **no fue modificada** para mantener la estabilidad en producción
- La solución es **mínima e quirúrgica**, solo toca el punto exacto del problema
- Se mantiene **compatibilidad total** con el flujo de generación inicial