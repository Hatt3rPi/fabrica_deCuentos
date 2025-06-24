# Nueva Etapa de Dedicatoria en Wizard

## 📋 Issues Resueltos
- Issue #248: Nueva etapa de dedicatoria en wizard y reorganización de descarga

## 🎯 Objetivo
Expandir el wizard de creación de cuentos con una nueva etapa dedicada para personalizar la dedicatoria, mejorando el valor emocional del producto final y reorganizando el flujo de descarga para una mejor experiencia de usuario.

**Flujo anterior:**
`characters → story → design → preview → export`

**Flujo nuevo:**
`characters → story → design → preview → dedicatoria → export`

## 📁 Archivos Modificados
- `src/context/WizardContext.tsx` - Actualizar tipo WizardStep, steps array, stepMap y función canProceed
- `src/stores/wizardFlowStore.ts` - Agregar estado 'dedicatoria' al EstadoFlujo interface
- `src/types/index.ts` - Agregar tipos para dedicatoria en StorySettings y WizardState
- `src/components/Wizard/steps/DedicatoriaStep.tsx` - Nuevo componente con funcionalidad completa
- `src/components/Wizard/Wizard.tsx` - Agregar import y case para DedicatoriaStep
- `src/components/Wizard/StepIndicator.tsx` - Incluir nuevos steps dedicatoria y export
- `src/components/Wizard/WizardNav.tsx` - Mover lógica de descarga a step 'export'
- `src/components/Wizard/steps/ExportStep.tsx` - Reorganizar para usar wizard context

## 🔧 Cambios Técnicos

### Antes
```typescript
export type WizardStep = 'characters' | 'story' | 'design' | 'preview' | 'export';

const steps: WizardStep[] = ['characters', 'story', 'design', 'preview', 'export'];
const stepMap: Record<WizardStep, keyof EstadoFlujo | null> = {
  characters: 'personajes',
  story: 'cuento',
  design: 'diseno',
  preview: 'vistaPrevia',
  export: null,
};
```

### Después  
```typescript
export type WizardStep = 'characters' | 'story' | 'design' | 'preview' | 'dedicatoria' | 'export';

const steps: WizardStep[] = ['characters', 'story', 'design', 'preview', 'dedicatoria', 'export'];
const stepMap: Record<WizardStep, keyof EstadoFlujo | null> = {
  characters: 'personajes',
  story: 'cuento',
  design: 'diseno',
  preview: 'vistaPrevia',
  dedicatoria: 'dedicatoria',
  export: null,
};
```

### Descripción del Cambio
Se agregó una nueva etapa 'dedicatoria' entre 'preview' y 'export' que permite personalizar un mensaje dedicatorio con imagen opcional. El componente DedicatoriaStep incluye:

1. **Editor de texto** con límite de 300 caracteres y ejemplos sugeridos
2. **Carga de imagen** con validación de tipo y tamaño (máx 5MB)
3. **Opciones de layout** (posición de imagen: arriba/abajo/izquierda/derecha)
4. **Configuración de diseño** (alineación de texto, tamaño de imagen)
5. **Vista previa en tiempo real** del resultado final
6. **Persistencia automática** en storySettings para auto-save

La lógica de descarga se movió completamente al step 'export', manteniendo la separación clara de responsabilidades:
- **Preview:** Solo para revisar y editar contenido
- **Dedicatoria:** Personalizar mensaje emocional
- **Export:** Finalizar y descargar cuento

## 🧪 Testing

### Manual
- [ ] Navegar hasta etapa preview y verificar que permite avanzar a dedicatoria
- [ ] Escribir texto de dedicatoria y verificar persistencia al cambiar de etapa
- [ ] Cargar imagen y probar diferentes opciones de layout
- [ ] Verificar vista previa actualiza en tiempo real
- [ ] Completar flujo hasta descarga y verificar funcionalidad intacta
- [ ] Recargar página en etapa dedicatoria y verificar estado preservado

### Automatizado
- [ ] `npm run cypress:run` - Tests existentes deben pasar (algunos pueden fallar por cambios de flujo)
- [ ] Test específico: `cypress/e2e/complete_story_flow.cy.js` - Actualizar para nuevo flujo
- [ ] Verificar no regresiones en funcionalidad relacionada (autosave, navegación)

## 🚀 Deployment

### Requisitos
- [ ] Build exitoso: `npm run build`
- [ ] Lint sin errores críticos: `npm run lint`
- [ ] No dependencias nuevas requeridas

### Pasos
1. Deploy a staging para testing QA completo
2. Verificar flujo de wizard funciona end-to-end
3. Deploy a producción con feature flag opcional

## 📊 Monitoreo

### Métricas a Observar
- **Tasa de completación de wizard:** Verificar que nueva etapa no reduzca conversión
- **Uso de dedicatoria:** Porcentaje de usuarios que agregan dedicatoria personalizada
- **Tiempo en etapa dedicatoria:** Tiempo promedio que usuarios pasan personalizando

### Posibles Regresiones
- **Navigation:** Verificar botones anterior/siguiente funcionan correctamente
- **Auto-save:** Confirmar que datos de dedicatoria se persisten correctamente
- **PDF generation:** Asegurar que nueva información se incluye en export final

## 🔗 Referencias
- Issue original: #248
- Commit: `aae7e2b` - feat: Agregar nueva etapa de dedicatoria en wizard
- Template seguido: `/docs/templates/solution.md`