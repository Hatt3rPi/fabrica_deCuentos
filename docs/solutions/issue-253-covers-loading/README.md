# Solución: Portadas no se muestran al continuar cuento en etapa Diseño

## Problema Original (Issue #253)

Al continuar la edición de un cuento desde MyStories que estaba en etapa "Cuento" completado, y luego avanzar a la etapa "Diseño", las portadas generadas y sus variantes de estilo no se visualizaban.

### Flujo del Problema
1. **MyStories.tsx** navegaba a `/wizard/${storyId}`
2. **StoryContext** no cargaba portadas existentes desde BD
3. **DesignStep.tsx** mostraba `covers[storyId]` como undefined
4. Usuario veía solo imágenes fallback en lugar de portadas generadas

### Causa Raíz
- `covers` state en StoryContext solo se poblaba cuando se generaban nuevas portadas
- No había función para recuperar portadas existentes de `story_pages` (page_number = 0)
- Las variantes de estilo en storage no se consultaban al continuar un cuento

## Solución Implementada

### 1. Nueva función `loadExistingCovers` en StoryContext

```typescript
const loadExistingCovers = async (storyId: string) => {
  // Cargar portada base desde story_pages donde page_number = 0
  const { data: coverPage } = await supabase
    .from('story_pages')
    .select('image_url')
    .eq('story_id', storyId)
    .eq('page_number', 0)
    .maybeSingle();

  // Cargar variantes desde storage
  const variants: Record<string, string> = {};
  const variantStatus: Record<string, 'ready' | 'idle'> = {};

  await Promise.all(
    STYLE_MAP.map(async (style) => {
      const variantPath = `covers/${storyId}_${style.key}.png`;
      const { data: file } = await supabase.storage
        .from('storage')
        .list('covers', { search: `${storyId}_${style.key}.png` });
      
      if (file && file.length > 0) {
        const { data: { publicUrl } } = supabase.storage
          .from('storage')
          .getPublicUrl(variantPath);
        
        variants[style.key] = publicUrl;
        variantStatus[style.key] = 'ready';
      }
    })
  );

  // Actualizar estado covers
  setCovers(prev => ({
    ...prev,
    [storyId]: {
      status: 'ready',
      url: baseUrl,
      variants,
      variantStatus
    }
  }));
};
```

### 2. Carga automática en WizardContext

```typescript
// En el useEffect que carga el draft
storyService.getStoryDraft(storyId).then(draft => {
  // ... cargar draft existente ...
  
  // Cargar portadas existentes si hay una portada base
  if (draft.pages && draft.pages.some(p => p.page_number === 0 && p.image_url)) {
    console.log('[WizardContext] Loading existing covers for story:', storyId);
    loadExistingCovers(storyId);
  }
});
```

### 3. Actualización de interfaces TypeScript

```typescript
interface StoryContextType {
  covers: Record<string, CoverInfo>;
  generateCover: (storyId: string, title: string, opts?: {...}) => Promise<string | undefined>;
  generateCoverVariants: (storyId: string, imageUrl: string) => Promise<void>;
  loadExistingCovers: (storyId: string) => Promise<void>; // ← Nueva función
}
```

## Archivos Modificados

- **`/src/context/StoryContext.tsx`**
  - Agrega función `loadExistingCovers`
  - Consulta portada base y variantes
  - Reconstruye estado covers

- **`/src/context/WizardContext.tsx`**
  - Importa `useStory` hook
  - Agrega carga automática de portadas al cargar draft

## Flujo de Corrección

1. **Usuario continúa cuento** desde MyStories → navega a `/wizard/{storyId}`
2. **WizardContext** detecta `storyId` y llama `getStoryDraft()`
3. **Si existe portada base**, llama `loadExistingCovers(storyId)`
4. **StoryContext** consulta BD para portada y storage para variantes
5. **DesignStep** muestra portadas existentes inmediatamente

## Consultas SQL Implementadas

### Portada base
```sql
SELECT image_url FROM story_pages 
WHERE story_id = ? AND page_number = 0
```

### Variantes de estilo
```sql
-- Storage list con búsqueda de archivos patrón: covers/{storyId}_{style}.png
-- Para cada estilo: kawaii, bordado, acuarela, dibujado, recortes
```

## Testing Manual

Para verificar la corrección:

1. **Crear cuento con portada**:
   - Completar etapas Personajes y Cuento
   - Generar portada y algunas variantes
   - Navegar a MyStories

2. **Continuar cuento**:
   - Hacer clic en "Continuar editando"
   - Verificar que navega a etapa Diseño
   - **Verificar que se muestran**: portada generada + variantes existentes

3. **Casos edge**:
   - Cuento sin portada → no debe cargar nada
   - Cuento con portada pero sin variantes → debe mostrar solo portada base
   - Storage corrupto → debe manejar errores graciosamente

## Logging Agregado

```typescript
console.log('[StoryContext] Loading existing covers for story:', storyId);
console.log('[StoryContext] Found variant:', style.key, publicUrl);
console.log('[StoryContext] Loaded existing covers:', {
  storyId, baseUrl, variants: Object.keys(variants), variantStatus
});
```

## Optimizaciones Implementadas

### 1. **Consultas Optimizadas**
```typescript
// ANTES: Múltiples consultas individuales
STYLE_MAP.map(async (style) => {
  await supabase.storage.from('storage').list('covers', {
    search: `${storyId}_${style.key}.png`
  });
});

// DESPUÉS: Una sola consulta para todos los archivos
const { data: allCoverFiles } = await supabase.storage
  .from('storage')
  .list('covers', { 
    search: `${storyId}_` // Lista todos los archivos del story
  });
```

### 2. **Cache Busting Consistente**
```typescript
// Agregar timestamp para forzar actualización de cache
variants[style.key] = `${publicUrl}?t=${Date.now()}`;
```

### 3. **Prevención de Race Conditions**
```typescript
const [isLoadingExistingCovers, setIsLoadingExistingCovers] = useState(false);

const loadExistingCovers = async (storyId: string) => {
  if (isLoadingExistingCovers) {
    console.log('Already loading covers, skipping duplicate request');
    return;
  }
  setIsLoadingExistingCovers(true);
  // ... lógica de carga ...
  setIsLoadingExistingCovers(false);
};
```

### 4. **Manejo de Errores Mejorado**
```typescript
// Solo propagar errores críticos, ignorar "no encontrado"
if (coverError && coverError.code !== 'PGRST116') { // PGRST116 = No rows found (OK)
  throw new Error(`Error loading covers: ${coverError.message}`);
}

// Estado de error específico por story
setCovers(prev => ({
  ...prev,
  [storyId]: {
    status: 'error',
    error: err instanceof Error ? err.message : 'Unknown error loading covers'
  }
}));
```

## Beneficios

- ✅ **UX mejorado**: Los usuarios ven su progreso visual inmediatamente
- ✅ **Continuidad**: No se pierde trabajo previo de generación de portadas
- ✅ **Performance optimizada**: Una sola consulta vs múltiples requests
- ✅ **Cache busting**: Garantiza imágenes actualizadas
- ✅ **Race condition protection**: Previene cargas duplicadas
- ✅ **Error handling robusto**: Maneja errores críticos vs esperados
- ✅ **Consistencia**: Funciona para todos los estilos visuales
- ✅ **Robustez**: Maneja casos edge y errores graciosamente

## Compatibilidad

- ✅ Compatible con cuentos existentes
- ✅ No afecta flujo de creación de nuevos cuentos
- ✅ Mantiene estructura de datos existente
- ✅ No requiere migraciones de BD

## Referencias

- **Issue original**: #253
- **Pull Request**: [Pendiente]
- **Archivos principales**: StoryContext.tsx, WizardContext.tsx
- **Componente afectado**: DesignStep.tsx
- **Tablas BD**: story_pages, storage bucket 'storage'