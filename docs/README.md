# Documentación del Proyecto

## 📚 Guías Disponibles

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Issues activos y backlog de problemas pendientes
- **[ISSUE_TEMPLATE.md](./ISSUE_TEMPLATE.md)** - Template estandarizado para crear issues de calidad
- **[../CLAUDE.md](../CLAUDE.md)** - Guía para trabajar con Claude Code

## 🔄 Ciclo de Desarrollo

### 1. Identificación de Problemas
- Durante desarrollo, documentar issues en `TROUBLESHOOTING.md`
- Categorizar por prioridad y impacto
- Estimar esfuerzo requerido

### 2. Planificación de Sprints
- Seleccionar issues del backlog según prioridad
- Crear branches específicos para cada issue
- Definir criterios de aceptación

### 3. Resolución y Documentación
- Implementar solución en branch específico
- Documentar solución completa en el GitHub issue
- Remover issue de `TROUBLESHOOTING.md` (mantener solo activos)
- Crear tests para prevenir regresiones

### 4. Revisión y Aprendizaje
- Analizar patrones de problemas recurrentes
- Actualizar mejores prácticas en `CLAUDE.md`
- Refinar proceso de desarrollo

## 🎯 Objetivos de Documentación

- **Continuidad:** Permitir que cualquier desarrollador entienda problemas pasados
- **Eficiencia:** Evitar resolver el mismo problema múltiples veces
- **Calidad:** Mejorar el proceso de desarrollo basado en experiencias
- **Transparencia:** Mantener visibilidad del estado del proyecto

## 📋 Convenciones

### Para Issues:
- Usar formato `ISSUE-XXX` para numeración secuencial
- Incluir fecha, severidad, descripción y estimación
- Actualizar estado cuando se resuelve

### Para Soluciones:
- Documentar archivos afectados
- Incluir commits relevantes
- Explicar el razonamiento detrás de la solución

### Para Commits:
- Referenciar issues cuando corresponda: `refs #ISSUE-001`
- Usar emojis descriptivos: 🔧 para fixes, ✨ para features
- Incluir contexto del problema resuelto