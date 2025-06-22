# Solución: Error al Editar Prompts en Vista Previa

## Problema

Al editar prompts de páginas (no portada) en la etapa de vista previa, ocurrían dos problemas:

1. **Error en Edge Function**: `Error: Faltan story_id o page_id` al hacer click en regenerar
2. **Parpadeo de imagen**: La imagen pestañeaba al escribir cada carácter en el editor de prompt

## Causa Raíz

1. **Error de Edge Function**: La función `generatePageImage` no soportaba prompts personalizados, a diferencia de `generateCoverImage` que sí actualizaba el prompt en la base de datos antes de regenerar
2. **Parpadeo**: El componente `<img>` usaba `Date.now()` en el `key` y añadía timestamp al `src`, causando re-renderizado completo al escribir

## Solución Implementada

### 1. Actualización de `storyService.ts`
```typescript
async generatePageImage(storyId: string, pageId: string, customPrompt?: string): Promise<string> {
  // Si se proporciona prompt personalizado, actualizarlo primero en DB
  if (customPrompt) {
    const { error } = await supabase
      .from('story_pages')
      .update({ prompt: customPrompt })
      .eq('id', pageId)
      .eq('story_id', storyId);
    
    if (error) {
      throw new Error('Error al actualizar el prompt de la página');
    }
  }
  // Continuar con la generación...
}
```

### 2. Actualización de `WizardContext.tsx`
```typescript
const generatePageImage = async (pageId: string, customPrompt?: string) => {
  // Ahora acepta prompt personalizado
  const imageUrl = await storyService.generatePageImage(storyId, pageId, customPrompt);
  // Actualizar estado local incluyendo el nuevo prompt
}
```

### 3. Actualización de `PreviewStep.tsx`
```typescript
// Pasar promptText al regenerar páginas normales
await generatePageImage(pageId, promptText);

// Eliminar timestamp dinámico del elemento img
<img
  key={`${currentPageData.id}-${currentPageData.imageUrl}`}
  src={currentPageData.imageUrl || '/placeholder-image.png'}
  // Sin ?t=${Date.now()}
/>
```

## Archivos Modificados

- `src/services/storyService.ts`: Añadir soporte para prompt personalizado
- `src/context/WizardContext.tsx`: Actualizar firma de función y manejo de estado
- `src/components/Wizard/steps/PreviewStep.tsx`: Pasar prompt y eliminar timestamp

## Beneficios

1. **Consistencia**: Ahora tanto páginas normales como portadas funcionan igual al editar prompts
2. **UX mejorada**: Sin parpadeo al escribir en el editor
3. **Robustez**: El prompt se actualiza en DB antes de regenerar, evitando desincronización

## Testing

Para verificar la solución:
1. Ir a vista previa de un cuento
2. Click en "Editar prompt de esta página"
3. Modificar el prompt y hacer click en "Regenerar"
4. Verificar que no hay parpadeo al escribir
5. Verificar que la imagen se regenera con el nuevo prompt