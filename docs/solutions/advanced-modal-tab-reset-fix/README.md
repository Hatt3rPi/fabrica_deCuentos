# Fix: AdvancedEditModal Tab Reset on Regeneration

## Problema

El AdvancedEditModal restablecía automáticamente el `activeTab` a 'text' cuando el usuario regeneraba una imagen estando en la pestaña 'prompt', interrumpiendo el flujo de trabajo del usuario.

## Causa Raíz

En `/src/components/Wizard/steps/components/AdvancedEditModal.tsx`, el hook `useEffect` que dependía de `[isOpen, pageData]` se ejecutaba tanto al abrir el modal como cuando `pageData` cambiaba durante la regeneración de imágenes:

```typescript
// ❌ Problema original
useEffect(() => {
  if (isOpen) {
    setLocalText(pageData.text);
    setLocalPrompt(pageData.prompt);
    setHasChanges(false);
    setActiveTab('text'); // ← Siempre reseteaba a 'text'
    setShowPreview(false);
    setLastImageUrl(pageData.imageUrl);
    setIsImageLoading(false);
  }
}, [isOpen, pageData]); // ← Dependía de ambos
```

### Flujo del Problema

1. Usuario abre modal (se establece en tab 'text' - correcto)
2. Usuario cambia a tab 'prompt'
3. Usuario hace clic en "Regenerar imagen"
4. Nueva imagen se genera → `pageData.imageUrl` cambia
5. El `useEffect` se ejecuta → `setActiveTab('text')` se llama
6. Usuario es forzado de vuelta al tab 'text' (incorrecto)

## Solución Implementada

Separamos las responsabilidades en dos hooks `useEffect` diferentes:

```typescript
// ✅ Solo resetea todo cuando el modal se abre por primera vez
useEffect(() => {
  if (isOpen) {
    setLocalText(pageData.text);
    setLocalPrompt(pageData.prompt);
    setHasChanges(false);
    setActiveTab('text'); // Solo resetea tab al abrir modal
    setShowPreview(false);
    setLastImageUrl(pageData.imageUrl);
    setIsImageLoading(false);
  }
}, [isOpen]); // Solo depende de isOpen

// ✅ Actualiza datos durante sesión activa, preserva activeTab
useEffect(() => {
  if (isOpen) {
    setLocalText(pageData.text);
    setLocalPrompt(pageData.prompt);
    setHasChanges(false);
    // No resetea activeTab - preserva la selección del usuario
    setLastImageUrl(pageData.imageUrl);
    setIsImageLoading(false);
  }
}, [pageData]); // Solo depende de pageData
```

## Comportamiento Esperado

### ✅ Escenario 1: Modal Abierto por Primera Vez
- Modal abre en tab 'text' (comportamiento actual preservado)
- Estado se inicializa correctamente

### ✅ Escenario 2: Regeneración desde Tab 'prompt'
- Usuario cambia a tab 'prompt'
- Usuario regenera imagen
- Modal permanece en tab 'prompt' (nuevo comportamiento correcto)
- Vista previa se actualiza con nueva imagen

### ✅ Escenario 3: Regeneración desde Tab 'text'
- Usuario permanece en tab 'text'
- Usuario hace cambios y regenera imagen
- Modal permanece en tab 'text'
- Estado se actualiza correctamente

## Archivos Modificados

- `/src/components/Wizard/steps/components/AdvancedEditModal.tsx` - Separación de hooks useEffect

## Pruebas

### Verificación Manual
1. Abrir modal de edición avanzada en cualquier página
2. Cambiar a tab 'Prompt de Imagen'
3. Modificar el prompt si es necesario
4. Hacer clic en "Regenerar Imagen"
5. Verificar que el modal permanece en el tab 'Prompt de Imagen'
6. Verificar que la nueva imagen aparece en la vista previa

### Casos de Prueba
- [ ] Modal abre en tab 'text' por defecto
- [ ] Cambiar entre tabs funciona correctamente
- [ ] Regenerar desde tab 'prompt' mantiene el tab activo
- [ ] Regenerar desde tab 'text' mantiene el tab activo
- [ ] Cerrar y reabrir modal resetea a tab 'text'
- [ ] Los datos se actualizan correctamente en ambos tabs

## Notas Técnicas

- La separación de responsabilidades mejora la mantenibilidad del código
- El comportamiento de apertura del modal se mantiene igual
- Solo el comportamiento durante la sesión activa cambia
- No hay impacto en el rendimiento (mismo número de re-renders)

## Fecha de Implementación

2025-06-23