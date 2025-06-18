# 📚 Sistema de Documentación Centralizado

Este directorio contiene toda la documentación técnica del proyecto, organizada por categorías para facilitar navegación y mantenimiento.

## 🗂️ Estructura del Sistema

### 📋 [Solutions](./solutions/) - Soluciones Implementadas
Documentación detallada de todas las soluciones y fixes implementados en el proyecto.
- [preview-corrections/](./solutions/preview-corrections/) - Correcciones UI/UX en vista previa
- [story-completion/](./solutions/story-completion/) - Sistema completo de finalización

### 🧩 [Components](./components/) - Documentación de Componentes
Documentación técnica de componentes React clave del proyecto.

### ⚙️ [Tech](./tech/) - Documentación Técnica  
Arquitectura, Edge Functions, y documentación técnica avanzada.

### 🔧 [Maintenance](./maintenance/) - Guías Operacionales
Procedimientos de deployment, troubleshooting y monitoreo del sistema.

### 📄 [Templates](./templates/) - Templates Estandarizados
Templates para mantener consistencia en la documentación.

## 📚 Guías de Referencia Rápida

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Issues activos y backlog de problemas pendientes
- **[ISSUE_TEMPLATE.md](./ISSUE_TEMPLATE.md)** - Template estandarizado para crear issues de calidad
- **[../CLAUDE.md](../CLAUDE.md)** - Guía para trabajar con Claude Code (incluye protocolo de documentación)

### 🔧 Documentación Técnica

#### Performance & Optimization:
- **[tech/parallel-image-generation.md](./tech/parallel-image-generation.md)** - Sistema de generación paralela de imágenes (Issue #194)
- **[tech/story-generation.md](./tech/story-generation.md)** - Generación de cuentos y portadas
- **[tech/generate-image-pages.md](./tech/generate-image-pages.md)** - Edge Function para imágenes de páginas

#### Componentes UI:
- **[components/PreviewStep.md](./components/PreviewStep.md)** - Vista previa con generación paralela
- **[components/WizardNav.md](./components/WizardNav.md)** - Navegación del wizard
- **[components/OverlayLoader.md](./components/OverlayLoader.md)** - Loader con progress tracking

#### Flujo de Trabajo:
- **[flow/wizard-states.md](./flow/wizard-states.md)** - Estados del wizard
- **[flow/user-flow.md](./flow/user-flow.md)** - Flujo completo del usuario

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