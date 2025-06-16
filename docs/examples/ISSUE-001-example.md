# Ejemplo de Issue usando Template

## ISSUE-001: Modal Loading States Inconsistency

**Épica:** UX Improvements  
**Categoría:** improvement  
**Prioridad:** Alta  
**Estimación:** 2-3 horas  

### Archivos afectados:
- `src/components/Modal/CharacterSelectionModal.tsx` (ya parcialmente implementado)
- `src/components/Modals/ModalPersonajes.tsx` (ya parcialmente implementado)
- `src/components/Character/CharacterForm.tsx` (pendiente)
- `src/components/Wizard/steps/DesignStep.tsx` (pendiente)
- `src/components/Wizard/steps/StoryStep.tsx` (pendiente)

### 🧠 Contexto:
Actualmente los modales en la aplicación no muestran estados de carga consistentes durante operaciones asíncronas. Esto genera confusión en usuarios que no saben si la aplicación está procesando su solicitud y puede llevar a clics múltiples que causan race conditions. El problema se identificó durante testing del flujo de asociación de personajes donde users podían hacer múltiples clics antes de que apareciera feedback visual.

### 📐 Objetivo:
Estandarizar estados de loading en todos los modales para dar feedback visual inmediato al usuario durante operaciones asíncronas, previniendo confusión y acciones duplicadas.

### ✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- [ ] Todos los modales muestran loading state durante operaciones async
- [ ] Loading states son visualmente consistentes (mismo spinner, mismo mensaje)
- [ ] Botones se deshabilitan durante loading para prevenir múltiples clics
- [ ] Loading states aparecen inmediatamente al iniciar operación
- [ ] Loading states desaparecen al completar operación (éxito o error)
- [ ] Tests actualizados verifican presencia de loading states

### ❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- [ ] Modal permanece en loading state indefinidamente tras error
- [ ] Usuario puede hacer múltiples clics durante operación async
- [ ] Loading state aparece en el elemento incorrecto
- [ ] Loading interfiere con navegación normal del modal

### 🧪 QA / Casos de prueba esperados:
- [ ] Crear personaje → click "Generar" → debería mostrar spinner en botón
- [ ] Asociar personaje → click personaje → debería mostrar overlay de loading
- [ ] Generar historia → click "Generar" → debería mostrar loading y deshabilitar botón
- [ ] Error durante operación → loading desaparece y muestra mensaje de error
- [ ] Operación exitosa → loading desaparece y modal procede normal

### Notas para devs:
- Seguir patrón establecido en `CharacterSelectionModal.tsx` con `isLinking` state
- Usar componente `Loader` de lucide-react para consistencia
- Implementar loading states a nivel individual (no global) para mejor UX
- Considerar usar hook personalizado `useAsyncState` para estandarizar patrón

### EXTRAS:
- Evaluar crear hook `useAsyncOperation` para reutilizar lógica de loading
- Documentar patrón en CLAUDE.md para futuras implementaciones
- Considerar toast notifications para confirmación de operaciones exitosas

---

**Labels sugeridos:** `high-priority`, `enhancement`, `ui-ux`, `wizard`  
**Milestone:** Sprint actual - UX Improvements