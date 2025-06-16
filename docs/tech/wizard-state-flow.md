# Wizard State Flow - Análisis Completo

## 📖 Resumen Ejecutivo

El campo `wizard_state` en la tabla `stories` almacena el estado completo del flujo del wizard de creación de cuentos. Este documento analiza su implementación, flujos de estado, persistencia y estrategias de testing.

## 🏗 Arquitectura del Sistema

### Componentes Clave

```typescript
interface EstadoFlujo {
  personajes: {
    estado: 'no_iniciada' | 'borrador' | 'completado';
    personajesAsignados: number;
  };
  cuento: 'no_iniciada' | 'borrador' | 'completado';
  diseno: 'no_iniciada' | 'borrador' | 'completado';
  vistaPrevia: 'no_iniciada' | 'borrador' | 'completado';
}
```

### Stack Tecnológico
- **Base de Datos**: PostgreSQL con campo `jsonb` para `wizard_state`
- **Estado Local**: Zustand (`wizardFlowStore`) + React Context (`WizardContext`)
- **Persistencia**: Auto-save con localStorage backup
- **Validación**: TypeScript + validaciones en tiempo real

## 🔄 Flujo de Estados del Wizard

### Diagrama de Transiciones

```mermaid
stateDiagram-v2
    [*] --> no_iniciada
    
    state "Personajes" as P {
        no_iniciada --> borrador : 1-2 personajes
        borrador --> completado : 3+ personajes
        completado --> completado : agregar más
    }
    
    state "Cuento" as C {
        no_iniciada --> borrador : personajes completado
        borrador --> completado : historia generada
    }
    
    state "Diseño" as D {
        no_iniciada --> borrador : cuento completado
        borrador --> completado : estilo seleccionado
    }
    
    state "Vista Previa" as V {
        no_iniciada --> borrador : diseño completado
        borrador --> borrador : permanece en borrador
    }
    
    P --> C : avanzarEtapa('personajes')
    C --> D : avanzarEtapa('cuento')
    D --> V : avanzarEtapa('diseno')
```

### Reglas de Transición

#### 1. Personajes → Cuento
```typescript
// Trigger automático al alcanzar 3+ personajes
setPersonajes(count >= 3) → {
  personajes.estado = 'completado'
  cuento = 'borrador'
}
```

#### 2. Cuento → Diseño
```typescript
// Trigger manual en WizardNav.nextStep()
avanzarEtapa('cuento') → {
  cuento = 'completado'
  diseno = 'borrador'
}
```

#### 3. Diseño → Vista Previa
```typescript
// Trigger manual + generación de imágenes
avanzarEtapa('diseno') + generateAllImages() → {
  diseno = 'completado'
  vistaPrevia = 'borrador'
}
```

## 💾 Sistema de Persistencia

### Estrategia Dual: localStorage + Supabase

#### Auto-save Hook (`useAutosave`)
```typescript
const AUTOSAVE_DELAY = 1000; // 1 segundo debounce
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos entre reintentos
```

#### Flujo de Guardado
1. **Inmediato**: `localStorage.setItem(story_draft_${id}, data)`
2. **Debounced**: Persistencia a Supabase después de 1s
3. **Backup**: `localStorage.setItem(story_draft_${id}_backup, data)` en caso de error
4. **Retry**: Hasta 3 reintentos con backoff exponencial

#### Orden de Recuperación
1. `localStorage: story_draft_${id}_backup`
2. `localStorage: story_draft_${id}`  
3. `supabase: stories.wizard_state`

### Puntos de Actualización

| Trigger | Método | Frecuencia |
|---------|--------|------------|
| Estado del wizard cambia | `useAutosave` | Debounced 1s |
| Personajes agregados/editados | `storyService.persistStory` | Inmediato |
| Navegación entre pasos | `WizardNav.nextStep` | Inmediato |
| Configuración de diseño | Auto-save | Debounced 1s |

## 🧪 Testing Strategy

### Tests Unitarios Implementados

#### `wizardFlowStore.test.ts`
- ✅ Estado inicial correcto
- ✅ Transiciones de `setPersonajes`
- ✅ Flujo `avanzarEtapa` secuencial
- ✅ `setEstadoCompleto` y `resetEstado`
- ✅ Casos edge (regresión ilegal, múltiples llamadas)

#### `storyService.test.ts`
- ✅ Persistencia con `wizard_state` desde store
- ✅ Carga de `getStoryDraft` con estado completo
- ✅ Generación de historias e imágenes
- ✅ Manejo de errores de persistencia
- ✅ Operaciones CRUD completas

#### `useAutosave.test.ts`
- ✅ Inicialización con UUID válido/inválido
- ✅ Auto-save localStorage + Supabase
- ✅ Backup y recovery en errores
- ✅ Debounce de múltiples cambios
- ✅ Reintentos con backoff exponencial

### Tests E2E Implementados

#### `wizard_state_persistence.cy.js`
- ✅ Persistencia de estados del wizard
- ✅ Recuperación desde localStorage/backup/BD
- ✅ Sincronización con base de datos
- ✅ Limpieza de estado al salir
- ✅ Estados edge cases y corrupción

## 🚨 Problemas Identificados y Soluciones

### 1. Race Conditions
**Problema**: Auto-save simultáneo entre localStorage y BD
```typescript
// Solución: Debounce y orden de prioridad
useEffect(() => {
  clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(save, AUTOSAVE_DELAY);
}, [state, flow]);
```

### 2. Estado Inconsistente
**Problema**: `wizard_state` puede no reflejar UI actual
```typescript
// Solución: Validación y recuperación automática
if (s.wizard_state) {
  setEstadoCompleto(s.wizard_state);
} else {
  useWizardFlowStore.getState().resetEstado();
}
```

### 3. Cleanup Agresivo
**Problema**: Pérdida de estado al salir accidentalmente
```typescript
// Solución: Flag skipCleanup para edición de personajes
const { skipCleanup, setSkipCleanup } = useWizardFlowStore();
if (skipCleanup) {
  setSkipCleanup(false);
  return;
}
```

### 4. Validación de UUID
**Problema**: UUIDs inválidos causan errores de persistencia
```typescript
// Solución: Validación antes de persistir
const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
```

## 📋 Comandos de Testing

### Ejecutar Tests Unitarios
```bash
# Tests específicos de wizard state
npm test wizardFlowStore.test.ts
npm test storyService.test.ts  
npm test useAutosave.test.ts

# Todos los tests unitarios
npm test
```

### Ejecutar Tests E2E
```bash
# Test específico de persistencia
npx cypress run --spec "cypress/e2e/wizard_state_persistence.cy.js"

# Todos los tests E2E
npm run cypress:run
```

### Debugging
```bash
# Abrir Cypress GUI para debugging
npm run cypress:open

# Ver logs de auto-save en browser console
# Buscar: [WizardFlow:xxxxxx] 
```

## 🔧 Configuración para Desarrollo

### Variables de Entorno Requeridas
```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-key # Para tests
```

### Database Setup
```sql
-- Campo wizard_state ya existe en migración 20250626121500
ALTER TABLE stories ADD COLUMN IF NOT EXISTS wizard_state jsonb;
```

## 📊 Métricas y Monitoreo

### Logs de Estado
```typescript
// Todos los cambios se loguean con formato:
console.log(`[WizardFlow:${suffix}] ${accion}`, estado);

// Ejemplos:
// [WizardFlow:abc123] setPersonajes { personajes: 'completado', cuento: 'borrador', ... }
// [WizardFlow:abc123] avanzarEtapa { cuento: 'completado', diseno: 'borrador', ... }
```

### Puntos de Monitoreo
- Tiempo de auto-save (debe ser < 2s)
- Tasa de fallos de persistencia (debe ser < 1%)
- Recuperaciones desde backup (monitorear frecuencia)
- Abandonos del wizard (historias sin personajes)

## 🎯 Próximos Pasos

### Mejoras Recomendadas
1. **Validación de Integridad**: Verificar consistencia entre estado y BD
2. **Compresión**: Comprimir `wizard_state` para historias grandes
3. **Versionado**: Esquema de migración para cambios en `EstadoFlujo`
4. **Analytics**: Métricas de uso por paso del wizard
5. **Optimización**: Reducir frecuencia de auto-save para usuarios premium

### Tests Adicionales
1. **Performance**: Tests de carga con múltiples usuarios
2. **Concurrencia**: Múltiples tabs editando misma historia
3. **Offline**: Comportamiento sin conexión a internet
4. **Mobile**: Testing en dispositivos móviles

---

**Documento generado**: `docs/tech/wizard-state-flow.md`  
**Fecha**: 2025-01-15  
**Versión**: 1.0  
**Autor**: Claude Code Analysis