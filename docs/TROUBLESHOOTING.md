# Issues Activos y Troubleshooting

Este documento mantiene un registro de **problemas activos** identificados y el backlog de issues para futuros ciclos de desarrollo.

> 📌 **Nota:** Los problemas resueltos se documentan en los issues de GitHub correspondientes con sus commits y soluciones detalladas.

## 🎯 Issues Activos en GitHub

Todos los issues identificados han sido creados en GitHub con el prefijo `[auto]`:

### 🔴 Alta Prioridad
- **#179** - [auto] Modal Loading States Inconsistency
- **#180** - [auto] Test Selector Reliability  
- **#181** - [auto] Error Handling Standardization

### 🟡 Media Prioridad
- **#182** - [auto] Database Function Coverage
- **#183** - [auto] Test Data Management
- **#184** - [auto] Loading State Race Conditions

### 🟢 Baja Prioridad
- **#185** - [auto] Console Logs Cleanup
- **#186** - [auto] TypeScript Strict Mode

👉 **Ver todos los issues:** [GitHub Issues](https://github.com/Customware-cl/Lacuenteria/issues?q=is%3Aissue+is%3Aopen+%5Bauto%5D)

## 📝 Agregar Nuevos Issues

Para identificar nuevos problemas, usar el proceso documentado en [ISSUE_TEMPLATE.md](./ISSUE_TEMPLATE.md).

**Convención de títulos:**
- Issues manuales: `[CATEGORÍA]: Descripción`
- Issues auto-generados: `[auto][prioridad] Descripción`

Cuando se identifiquen nuevos problemas en este documento, se crearán automáticamente en GitHub con el formato `[auto][alta/media/baja]`.

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