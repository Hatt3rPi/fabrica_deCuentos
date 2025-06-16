# Issues Activos y Troubleshooting

Este documento mantiene un registro de **problemas activos** identificados y el backlog de issues para futuros ciclos de desarrollo.

> 📌 **Nota:** Los problemas resueltos se documentan en los issues de GitHub correspondientes con sus commits y soluciones detalladas.

## 🚨 Issues Pendientes

### Alto Prioridad

#### ISSUE-001: Modal Loading States Inconsistency
**Descripción:** Los modales no muestran estados de carga consistentes durante operaciones async  
**Impacto:** UX confusa, posibles race conditions  
**Archivos sugeridos:** `src/components/Modal/`, `src/components/Modals/`  
**Estimación:** 2-3 horas

#### ISSUE-002: Test Selector Reliability
**Descripción:** Tests fallan por falta de `data-testid` consistentes en componentes  
**Impacto:** CI/CD inestable, desarrollo lento  
**Archivos sugeridos:** `src/components/Character/CharacterCard.tsx`, tests en `cypress/e2e/`  
**Estimación:** 1-2 horas

#### ISSUE-003: Error Handling Standardization
**Descripción:** Manejo de errores inconsistente entre componentes (algunos usan alert, otros console.error)  
**Impacto:** UX inconsistente, debugging difícil  
**Archivos sugeridos:** Crear `src/utils/errorHandler.ts`, actualizar componentes  
**Estimación:** 4-5 horas

### Media Prioridad

#### ISSUE-004: Database Function Coverage
**Descripción:** Otras operaciones DB podrían beneficiarse de funciones RPC seguras  
**Impacto:** Potenciales errores similares al 409 en otras operaciones  
**Archivos sugeridos:** Revisar todos los `.from().insert()` y `.from().update()`  
**Estimación:** 3-4 horas

#### ISSUE-005: Test Data Management
**Descripción:** Limpieza de datos de prueba no es consistente entre tests  
**Impacto:** Tests pueden fallar por datos residuales  
**Archivos sugeridos:** `cypress/support/commands.js`, tests individuales  
**Estimación:** 2-3 horas

#### ISSUE-006: Loading State Race Conditions
**Descripción:** Múltiples requests simultáneos pueden causar estados inconsistentes  
**Impacto:** Datos duplicados o estados UI incorrectos  
**Archivos sugeridos:** Todos los componentes con operaciones async  
**Estimación:** 3-4 horas

### Baja Prioridad

#### ISSUE-007: Console Logs Cleanup
**Descripción:** Muchos console.log dejados en código de producción  
**Impacto:** Ruido en consola, potencial leak de información  
**Archivos sugeridos:** Búsqueda global de console.log  
**Estimación:** 1 hora

#### ISSUE-008: TypeScript Strict Mode
**Descripción:** Algunos tipos están como `any` o sin definir completamente  
**Impacto:** Pérdida de type safety, bugs potenciales  
**Archivos sugeridos:** `src/types/`, componentes con tipos loose  
**Estimación:** 4-6 horas

## 📋 Patrones de Problemas Identificados

### 1. **State Management Complexity**
- Múltiples fuentes de verdad (Context + Zustand + localStorage + DB)
- Solución: Definir clara responsabilidad de cada capa

### 2. **Async Operations Without Guards**
- Requests simultáneos, falta de loading states
- Solución: Implementar guards y estados de loading consistentes

### 3. **Database Direct Access**
- Inserts/updates directos sin validación
- Solución: Migrar a funciones RPC con validaciones

### 4. **Test Fragility**
- Dependencia en DOM específico sin data-testid
- Solución: Estandarizar atributos de testing

## 🔄 Ciclo de Issues

### Para próximo sprint:
1. **ISSUE-001** (Modal Loading States) - Crítico para UX
2. **ISSUE-002** (Test Selectors) - Crítico para CI/CD
3. **ISSUE-003** (Error Handling) - Importante para mantenimiento

### Para futuro:
- Issues de refactoring (TypeScript, cleanup)
- Optimizaciones de performance
- Mejoras de testing coverage

## 📝 Template para Nuevos Issues

```markdown
## ISSUE-XXX: [Título Descriptivo]
**Fecha identificado:** YYYY-MM-DD
**Severidad:** Alto/Medio/Bajo
**Descripción:** [Explicación clara del problema]
**Síntomas:** [Cómo se manifiesta el problema]
**Causa raíz:** [Si se conoce]
**Archivos afectados:** [Lista de archivos]
**Solución propuesta:** [Si se tiene idea de cómo solucionarlo]
**Estimación:** [Tiempo estimado]
**Dependencias:** [Otros issues o tareas relacionadas]
```

## 🔄 Proceso de Issues

### Flujo de Trabajo:
1. **Identificar problema** → Documentar en este archivo
2. **Crear GitHub issue** → Referenciar número ISSUE-XXX
3. **Resolver issue** → Documentar solución en GitHub
4. **Remover de este documento** → Mantener solo activos

### Enlaces Útiles:
- [Issues de GitHub](../../issues) - Historial completo de problemas y soluciones
- [Pull Requests](../../pulls) - Implementaciones de soluciones
- [CLAUDE.md](../CLAUDE.md) - Mejores prácticas para desarrollo

---

**Última actualización:** 2025-06-16  
**Próxima revisión:** Cada viernes para priorización de issues