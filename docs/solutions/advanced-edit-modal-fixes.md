# Fix AdvancedEditModal - Preservación de Tab y Manejo de Portada

## 📋 Issues Resueltos
- Problema 1: Tab se resetea a "Texto" al regenerar imagen en modal avanzado
- Problema 2: Error pageId undefined al editar prompt de portada en producción
- Problema 3: Botón "Guardar" queda deshabilitado después de regeneración exitosa

## 🎯 Objetivo
Corregir tres problemas críticos en el modal de edición avanzada del wizard de vista previa:
1. Preservar el tab activo durante regeneración de imágenes
2. Manejar correctamente las portadas que no tienen pageId válido en la base de datos
3. Mantener funcionalidad del botón "Guardar" después de regeneración exitosa

## 📁 Archivos Modificados
- `src/components/Wizard/steps/components/AdvancedEditModal.tsx` - Lógica de preservación de tabs
- `src/components/Wizard/steps/PreviewStep.tsx` - Validación de pageId para portadas

## 🔧 Cambios Técnicos

### Problema 1: Preservación de Tab

#### Antes
```typescript
// Reset al abrir modal y en cada actualización de pageData
useEffect(() => {
  if (isOpen) {
    setActiveTab('text'); // Se ejecutaba en cada actualización
    // ... otros resets
  }
}, [isOpen]); 

useEffect(() => {
  if (isOpen) {
    // ... actualizaciones
    // No había diferenciación entre primer abrir y actualizaciones
  }
}, [pageData]);
```

#### Después  
```typescript
// Estado de inicialización para diferenciar primer abrir vs actualizaciones
const [isInitialized, setIsInitialized] = useState(false);

// Solo reset completo en primer abrir
useEffect(() => {
  if (isOpen && !isInitialized) {
    setActiveTab('text'); // Solo en primer abrir
    setIsInitialized(true);
  } else if (!isOpen) {
    setIsInitialized(false); // Reset al cerrar
  }
}, [isOpen, isInitialized, pageData.text, pageData.prompt, pageData.imageUrl]);

// Actualizaciones preservan activeTab
useEffect(() => {
  if (isOpen && isInitialized) {
    // Actualizar estado sin tocar activeTab
  }
}, [isOpen, isInitialized, pageData.text, pageData.prompt, pageData.imageUrl]);
```

### Problema 2: Manejo de Portada

#### Antes
```typescript
// Intentaba updatePageContent sin validar pageId
const handleAdvancedSave = async (updates) => {
  await updatePageContent(currentPageData.id, updates); // Error si id es undefined
};
```

#### Después
```typescript
// Validación especial para portadas
const handleAdvancedSave = async (updates) => {
  const isCoverPage = currentPageData.pageNumber === 0;
  
  if (isCoverPage && (!currentPageData.id || currentPageData.id === 'undefined')) {
    // Manejo especial para portadas sin ID válido
    if (updates.prompt) {
      setGeneratedPages(prev => prev.map(p =>
        p.pageNumber === 0 ? { ...p, prompt: updates.prompt! } : p
      ));
    }
    // No intentar guardar en BD, solo estado local
  } else {
    // Flujo normal para páginas con ID válido
    await updatePageContent(currentPageData.id, updates);
  }
};
```

### Problema 3: Estado de Botón Guardar

#### Antes
```typescript
// Después de regeneración, hasChanges quedaba desincronizado
const handleRegenerate = async () => {
  if (localPrompt !== pageData.prompt) {
    await onSave({ prompt: localPrompt }); // Esto sincroniza el estado
  }
  await onRegenerate(localPrompt);
  // hasChanges sigue basándose en comparación desactualizada
};
```

#### Después  
```typescript
// Reset explícito de hasChanges después de regeneración exitosa
const handleRegenerate = async () => {
  if (localPrompt !== pageData.prompt) {
    await onSave({ prompt: localPrompt });
  }
  await onRegenerate(localPrompt);
  setHasChanges(false); // Reset explícito para mantener UI consistente
};
```

### Descripción del Cambio
1. **Estado de inicialización**: Añadido flag `isInitialized` para distinguir entre primera apertura del modal y actualizaciones posteriores durante regeneración
2. **Validación de pageId**: Verificación especial para portadas que pueden no tener ID válido en la base de datos
3. **Preservación de experiencia de usuario**: El tab "Prompt de imagen" se mantiene activo durante regeneración
4. **Consistencia de estado UI**: Reset explícito de `hasChanges` después de regeneración para mantener botón "Guardar" funcional

## 🧪 Testing

### Manual
- [x] Abrir modal en tab "Prompt de imagen"
- [x] Hacer cambios al prompt
- [x] Hacer clic en "Regenerar imagen"
- [x] Verificar que permanece en tab "Prompt de imagen" 
- [x] Verificar que botón "Guardar" sigue funcional después de regeneración
- [x] Probar regeneración en portada (página 0)
- [x] Probar regeneración en páginas normales
- [x] Verificar que no hay errores de pageId undefined

### Automatizado
- [x] `npm run dev` - Aplicación inicia sin errores
- [x] Verificar no hay nuevos errores de lint introducidos
- [x] Tests existentes deben seguir funcionando

## 🚀 Deployment

### Requisitos
- [x] No hay dependencias adicionales
- [x] Cambios son backwards compatible
- [x] No requiere migraciones de base de datos

### Pasos
1. Merge de la rama `fix/advanced-edit-modal-issues`
2. Deploy automático vía CI/CD
3. Verificación en entorno de producción

## 📊 Monitoreo

### Métricas a Observar
- Error rate en requests PATCH a `/rest/v1/story_pages` - debe reducirse
- User experience metrics en wizard preview step - mejoría esperada
- Time spent en modal de edición avanzada - puede incrementar (positivo)

### Posibles Regresiones
- Modal de edición: Verificar que sigue funcionando el guardado normal
- Estado del wizard: Confirmar que auto-save funciona correctamente
- Portadas: Validar que la información se guarda al completar el cuento

## 🔗 Referencias
- Commit: ff4a139 - fix: AdvancedEditModal preserva tab activo y maneja portada correctamente
- Commit: beb7998 - fix: Mantener estado consistente del botón Guardar post-regeneración
- Branch: fix/advanced-edit-modal-issues
- PR: #244 - fix: AdvancedEditModal preserva tab activo y corrige manejo de portada
- Related: AdvancedEditModal, PreviewStep wizard components