# Sistema de Bloqueo Incremental en Wizard

## 📋 Issues Resueltos
- Issue #266: Los campos de dedicatoria no quedan bloqueados después de la generación del PDF

## 🎯 Objetivo
Implementar un sistema de bloqueo incremental de dos niveles en el wizard de creación de historias:
- **Nivel 1**: Después de generar vista previa → bloquea personajes, cuento y diseño
- **Nivel 2**: Después de generar PDF → bloquea dedicatoria-choice, dedicatoria y preview (solo permite export)

## 📁 Archivos Modificados
- `src/hooks/useWizardLockStatus.ts` - Hook central para manejo de lógica de bloqueos
- `src/context/WizardContext.tsx` - Integración con eventos de export exitoso
- `src/components/Wizard/steps/DedicatoriaChoiceStep.tsx` - Integración con sistema de bloqueo
- `src/components/Wizard/steps/DedicatoriaStep.tsx` - Refactorización en sub-componentes

## 🔧 Cambios Técnicos

### Sistema de Detección de Estados

#### Antes
```typescript
// No había sistema centralizado de bloqueos
// Cada componente manejaba su propio estado de edición
```

#### Después  
```typescript
// Hook centralizado que detecta automáticamente los niveles de bloqueo
const useWizardLockStatus = (): WizardLockStatus => {
  // Nivel 1: Vista previa generada
  const isPreviewGenerated = useMemo(() => {
    return generatedPages.some(page => page.pageNumber > 0 && page.imageUrl);
  }, [generatedPages]);

  // Nivel 2: PDF completado
  const isPdfCompleted = useMemo(() => {
    return storyData?.status === 'completed';
  }, [storyData]);

  // Lógica centralizada de bloqueos
  const isStepLocked = useCallback((step: WizardStep): boolean => {
    // Nivel 2: PDF completado - bloquea todas las etapas excepto export
    if (isPdfCompleted) {
      return step !== 'export';
    }
    
    // Nivel 1: Vista previa generada - bloquea etapas iniciales
    if (isPreviewGenerated) {
      return ['characters', 'story', 'design'].includes(step);
    }
    
    return false;
  }, [isPdfCompleted, isPreviewGenerated]);
};
```

### Persistencia con localStorage
```typescript
// Respaldo automático para preservar estado entre navegaciones
const setStoryData = (data: StoryData | null) => {
  setStoryDataInternal((prev) => {
    const newData = typeof data === 'function' ? data(prev) : data;
    if (newData && storyId) {
      const cacheKey = `story_lock_status_${storyId}`;
      localStorage.setItem(cacheKey, JSON.stringify(newData));
    }
    return newData;
  });
};
```

### Eventos de Actualización
```typescript
// Sistema de eventos para refrescar estado después de export exitoso
if (result.success) {
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('story-status-updated', { 
      detail: { storyId, status: 'completed' } 
    }));
  }, 1000);
}
```

### Descripción del Cambio
Se implementó un sistema robusto de bloqueo incremental que:
1. **Detecta automáticamente** el estado de la historia (vista previa/PDF completado)
2. **Persiste el estado** usando localStorage como respaldo
3. **Escucha cambios en tiempo real** vía Supabase realtime
4. **Maneja eventos de export** para actualización inmediata
5. **Centraliza la lógica** en un hook reutilizable

## 🧪 Testing

### Manual
- [x] **Nivel 1**: Crear historia → llegar a vista previa → generar imágenes → retroceder → verificar bloqueo de personajes/cuento/diseño
- [x] **Nivel 2**: Continuar hasta dedicatoria → completar export PDF → retroceder → verificar bloqueo de dedicatoria-choice/dedicatoria/preview
- [x] **Persistencia**: Refrescar página después de cada nivel → verificar que los bloqueos se mantienen
- [x] **Navegación desde Home**: Continuar historia desde /home → verificar bloqueos correctos según estado

### Automatizado
- [ ] `npm run cypress:run` - Tests existentes deben pasar
- [ ] Test específico: validar flujo completo de bloqueo incremental
- [ ] Verificar no regresiones en funcionalidad de wizard

## 🚀 Deployment

### Requisitos
- [x] No requiere dependencias adicionales
- [x] No requiere migraciones de base de datos
- [x] Compatible con estructura existente de Supabase

### Pasos
1. Merge del código a branch principal
2. Deploy automático vía sistema existente
3. Verificación post-deployment con usuario de prueba

## 📊 Monitoreo

### Métricas a Observar
- **Funcionalidad de bloqueo**: Verificar que los bloqueos se activan correctamente en ambos niveles
- **Persistencia de estado**: Confirmar que los bloqueos se mantienen al recargar página
- **Performance**: Monitorear que no haya degradación en velocidad de carga del wizard

### Posibles Regresiones
- **Wizard flow**: Vigilar que la navegación entre pasos siga funcionando correctamente
- **Auto-save**: Verificar que el sistema de guardado automático no se vea afectado
- **Export de PDF**: Confirmar que la funcionalidad de export mantiene su comportamiento

## 🔗 Referencias
- Issue #266: Sistema de bloqueo incremental para wizard
- Edge Function `story-export`: Maneja actualización de status a 'completed'
- Documentación de Supabase Realtime para suscripciones a cambios

## 📝 Notas Adicionales

### Arquitectura del Sistema
El sistema implementa un patrón de **estado distribuido** donde:
- El **hook `useWizardLockStatus`** actúa como fuente de verdad única
- **localStorage** funciona como cache de respaldo
- **Supabase realtime** mantiene sincronización automática
- **Eventos custom** permiten actualizaciones inmediatas

### Simplificaciones Realizadas
- Se removieron protecciones complejas contra regresión de status que bloqueaban actualizaciones legítimas
- Se simplificó el sistema de eventos para confiar en la Edge Function como fuente de verdad
- Se optimizó el código removiendo logs de debug innecesarios

### Ventajas del Enfoque
1. **Robustez**: Múltiples mecanismos de respaldo (DB + localStorage + eventos)
2. **Performance**: Detección automática sin polling innecesario  
3. **Mantenibilidad**: Lógica centralizada en un solo hook
4. **UX**: Bloqueos inmediatos y persistentes entre sesiones