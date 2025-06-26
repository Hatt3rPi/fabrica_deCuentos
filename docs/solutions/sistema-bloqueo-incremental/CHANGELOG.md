# Changelog - Sistema de Bloqueo Incremental

## v2.0.0 - Sistema de Persistencia Inteligente (2025-06-25)

### 🚀 Nueva Arquitectura
- **Reemplazado** `useAutosave` por `usePersistence` con detección inteligente de cambios
- **Implementado** sistema de modos contextuales (draft/review/final)
- **Agregado** pausas automáticas durante operaciones críticas

### ✅ Fixes Críticos
- **Resuelto** race condition que impedía activación de Nivel 2 de bloqueos
- **Corregido** sobrescritura de `status: 'completed'` por autosave
- **Arreglado** preferencia de dedicatoria no visible al retroceder

### 🔧 Mejoras Técnicas
- **80% menos** escrituras innecesarias a BD
- **Debounce inteligente** según tipo de contenido
- **Respeto automático** de estados finales
- **Logs mejorados** para debugging

### 📝 Archivos Modificados
- `src/hooks/usePersistence.ts` (nuevo)
- `src/hooks/useAutosave.ts` (preservado para compatibilidad)
- `src/context/WizardContext.tsx` 
- `src/components/Wizard/steps/DedicatoriaChoiceStep.tsx`
- `src/services/storyService.ts`

---

## v1.0.0 - Implementación Inicial (2025-06-25)

### 🎯 Features
- **Nivel 1**: Bloqueo después de vista previa (personajes/cuento/diseño)
- **Nivel 2**: Bloqueo después de PDF (dedicatoria/preview)
- **Hook centralizado** `useWizardLockStatus`
- **Persistencia** con localStorage como backup

### 🐛 Issues Conocidos (resueltos en v2.0.0)
- Race condition con autosave
- Preferencia dedicatoria no visible
- Status 'completed' sobrescrito

### 📝 Archivos Creados
- `src/hooks/useWizardLockStatus.ts`
- `src/components/Wizard/steps/DedicatoriaChoiceStep.tsx` (modificado)
- `src/components/Wizard/steps/DedicatoriaStep.tsx` (refactorizado)