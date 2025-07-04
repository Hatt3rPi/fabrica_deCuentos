# Fix: Datos Faltantes en Página de Compras

## Problema Identificado

Las historias en la página "Mis Compras" no mostraban título ni portada, y el botón de descarga permanecía en estado "Generando..." incluso cuando el PDF estaba disponible.

## Análisis de la Causa

### Problema Principal
En `src/pages/MyPurchases.tsx`, la consulta a la tabla `stories` solo incluía `pdf_url` pero no `export_url`:

```typescript
// ❌ Consulta incompleta
const { data: storiesData } = await supabase
  .from('stories')
  .select('id, title, cover_url, pdf_url')  // Faltaba export_url
  .in('id', storyIds);
```

### Inconsistencia con Hook
El hook `useStoryPurchaseStatus.ts` sí verificaba ambos campos (`pdf_url` y `export_url`), pero la página de compras no, causando inconsistencia.

## Solución Implementada

### 1. Incluir export_url en Consulta
```typescript
// ✅ Consulta completa
const { data: storiesData } = await supabase
  .from('stories')
  .select('id, title, cover_url, pdf_url, export_url')
  .in('id', storyIds);
```

### 2. Usar export_url como Fallback
```typescript
// ✅ Lógica mejorada del botón
<Button
  onClick={() => item.story && handleDownloadPdf(
    item.story.pdf_url || item.story.export_url || '',  // Fallback
    item.story.title
  )}
  disabled={!(item.story?.pdf_url || item.story?.export_url)}  // Verificar ambos
>
  {(item.story?.pdf_url || item.story?.export_url) ? 'Descargar PDF' : 'Generando...'}
</Button>
```

## Archivos Modificados

- `src/pages/MyPurchases.tsx`
  - Línea 70: Agregado `export_url` a la consulta
  - Líneas 237-247: Actualizada lógica del botón de descarga

## Resultados

### Antes
- ❌ Historias sin título ni portada
- ❌ Botón siempre en "Generando..."
- ❌ Descargas no funcionaban

### Después  
- ✅ Títulos y portadas visibles
- ✅ Botón muestra estado correcto
- ✅ Descargas funcionan con pdf_url o export_url

## Verificación

1. ✅ Consulta incluye todos los campos necesarios
2. ✅ Lógica consistente con `useStoryPurchaseStatus`
3. ✅ Fallback funcional entre pdf_url y export_url
4. ✅ Estados de UI correctos

## Impacto

- **Funcionalidad**: Restaura visualización completa de compras
- **UX**: Elimina confusión sobre estado de "Generando..."
- **Consistencia**: Alinea página con lógica del hook existente