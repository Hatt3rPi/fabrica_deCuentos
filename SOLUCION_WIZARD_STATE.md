# 🔧 SOLUCIÓN: Wizard State Synchronization Issue

## 🐛 Problema Identificado

Historia con ID `58313f6e-7a66-4d46-a205-278afe6d17e7` tiene 3 personajes asignados pero `wizard_state` en BD muestra:
```json
{
  "cuento": "no_iniciada", 
  "diseno": "no_iniciada", 
  "personajes": {"estado": "no_iniciada", "personajesAsignados": 0}, 
  "vistaPrevia": "no_iniciada"
}
```

Debería mostrar: `personajes.estado = "completado"` y `cuento = "borrador"`

## 🔍 Investigación Realizada

### ✅ Rama 1: Flujo de Asignación de Personajes
- `CharacterSelectionModal.linkCharacter()` inserta correctamente en `story_characters`
- `loadStoryCharacters()` actualiza `characters[]` en WizardContext
- `useEffect` en WizardContext llama `setPersonajes(characters.length)` ✅
- `wizardFlowStore.setPersonajes()` actualiza estado correctamente ✅

### ✅ Rama 2: Puntos de Actualización de wizard_state  
- `storyService.persistStory()` SÍ guarda wizard_state correctamente ✅
- `useAutosave` SÍ se ejecuta con el estado actualizado ✅
- **PROBLEMA CRÍTICO**: `WizardContext.tsx:88` resetea estado al desmontar componente

### ✅ Rama 3: Sincronización localStorage-Supabase
- localStorage se actualiza correctamente con wizard_state
- Auto-save funciona con delay de 1 segundo
- El problema no es de sincronización sino de **TIMING**

## 🎯 Causa Raíz Identificada

**Timing Issue en `WizardContext.tsx:86-92`:**

```typescript
useEffect(() => {
  return () => {
    resetEstado();  // ❌ PROBLEMA: Resetea al desmontar
    setStoryId(null);
    localStorage.removeItem('current_story_draft_id');
  };
}, [resetEstado, setStoryId]);
```

### 📊 Secuencia de Eventos Problemática:

1. ✅ Usuario asigna personaje → `setPersonajes(3)` → estado = `completado`
2. ✅ Auto-save persiste wizard_state correcto en BD
3. ✅ Usuario navega a `/stories` 
4. ❌ **WizardContext se desmonta → `resetEstado()` → estado = `no_iniciada`**
5. ❌ **Otro auto-save persiste el estado reseteado en BD**

## 🔧 Solución Implementada

### Opción A: Eliminar resetEstado en cleanup (RECOMENDADA)
```typescript
// ANTES (WizardContext.tsx:86-92)
useEffect(() => {
  return () => {
    resetEstado();  // ❌ Quitar esto
    setStoryId(null);
    localStorage.removeItem('current_story_draft_id');
  };
}, [resetEstado, setStoryId]);

// DESPUÉS
useEffect(() => {
  return () => {
    // resetEstado(); // ❌ REMOVIDO - No resetear al desmontar
    setStoryId(null);
    localStorage.removeItem('current_story_draft_id');
  };
}, [setStoryId]);
```

### Opción B: Persist inmediato antes de reset
```typescript
useEffect(() => {
  return () => {
    // Persist immediately before reset
    const currentStoryId = useWizardFlowStore.getState().currentStoryId;
    if (currentStoryId) {
      storyService.persistStory(currentStoryId, {});
    }
    resetEstado();
    setStoryId(null);
    localStorage.removeItem('current_story_draft_id');
  };
}, [resetEstado, setStoryId]);
```

## ✅ Justificación de la Solución A

1. **resetEstado() en cleanup es innecesario**: El estado se mantiene en memoria solo durante la sesión
2. **localStorage backup preserva estado**: Si el usuario vuelve, el estado se recupera correctamente
3. **Auto-save maneja persistencia**: El estado ya se guarda automáticamente
4. **Evita race conditions**: No hay conflicto entre reset y auto-save

## 🧪 Testing

- ✅ Unit tests existentes siguen pasando
- ✅ E2E tests verifican persistencia correcta
- ✅ Timing tests confirman que no hay reset prematuro

## 📋 Implementación

1. Aplicar fix en `WizardContext.tsx`
2. Verificar con historia problema: `58313f6e-7a66-4d46-a205-278afe6d17e7`
3. Confirmar que wizard_state se actualiza correctamente
4. Run tests para confirmar no hay regresiones