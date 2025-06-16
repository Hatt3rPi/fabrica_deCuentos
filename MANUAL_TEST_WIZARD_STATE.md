# 🧪 TEST MANUAL: Wizard State Synchronization

## 🎯 Objetivo
Verificar que el fix funciona y forzar la sincronización correcta del wizard_state

## 📋 Pasos a seguir:

### PASO 1: Verificar estado actual
1. Login con `fabarca212@gmail.com` / `test123`
2. Click en "Continuar" del cuento problema
3. **ANOTAR** el log `[Home] wizard_state` que aparece en consola
4. **ANOTAR** el log `[Home] continuar` con los campos reales

### PASO 2: Navegar al wizard y forzar sincronización
1. Ir al wizard: `/wizard/58313f6e-7a66-4d46-a205-278afe6d17e7`
2. Esperar 3 segundos para que cargue completamente
3. Abrir DevTools → Console
4. **VERIFICAR** logs que contengan `[WizardFlow]`
5. **VERIFICAR** localStorage con: `localStorage.getItem('story_draft_58313f6e-7a66-4d46-a205-278afe6d17e7')`

### PASO 3: Forzar recarga de personajes
Si no se muestran personajes:
1. En consola ejecutar:
```javascript
// Forzar recarga de personajes
window.location.reload();
```
2. Esperar 3 segundos
3. Verificar que aparezcan los personajes en la UI

### PASO 4: Forzar sincronización manual
En consola ejecutar:
```javascript
// Obtener el store y forzar sincronización
const storyId = '58313f6e-7a66-4d46-a205-278afe6d17e7';

// Simular asignación de 3 personajes
const wizardStore = window.useWizardFlowStore?.getState();
if (wizardStore) {
  console.log('Estado actual:', wizardStore.estado);
  wizardStore.setPersonajes(3);
  console.log('Estado después de setPersonajes(3):', wizardStore.estado);
}
```

### PASO 5: Navegar fuera y volver
1. Ir a `/stories`
2. Esperar 2 segundos
3. Click en "Continuar" nuevamente
4. **ANOTAR** el nuevo log `[Home] wizard_state`
5. **VERIFICAR** si cambió personajesAsignados de 0 a 3

## 📊 Resultados esperados:

### ANTES del fix (problema):
```json
{
  "personajes": {"estado": "no_iniciada", "personajesAsignados": 0},
  "cuento": "no_iniciada"
}
```

### DESPUÉS del fix (correcto):
```json
{
  "personajes": {"estado": "completado", "personajesAsignados": 3},
  "cuento": "borrador"
}
```

## 🐛 Si el problema persiste:

### Verificar en DevTools:
1. **Application** → **Local Storage** → buscar keys con `story_draft_`
2. **Network** → filtrar por `/stories` para ver las requests
3. **Console** → buscar errores o warnings

### Verificar que el fix está aplicado:
1. Ir a Sources → `src/context/WizardContext.tsx` línea ~88
2. Verificar que `resetEstado()` esté comentado:
```typescript
// resetEstado(); // REMOVED: Don't reset wizard state on unmount
```

## 📝 Log Template:

**PASO 1 - Estado inicial:**
- wizard_state: `{COPIAR_AQUÍ}`
- campos reales: `{COPIAR_AQUÍ}`

**PASO 5 - Estado después del test:**
- wizard_state: `{COPIAR_AQUÍ}`
- ¿Se sincronizó?: `SÍ/NO`