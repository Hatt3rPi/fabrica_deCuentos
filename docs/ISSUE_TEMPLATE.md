# 📄 Template Estandarizado para Issues

## Estructura Base

```markdown
## [TÍTULO DEL ISSUE]

**Épica:** [Nombre de la épica o módulo principal]  
**Categoría:** [bug | feature | improvement | refactor | docs | test]  
**Prioridad:** [Alta | Media | Baja]  
**Estimación:** [X horas/días]  

### Archivos afectados:
[Identifica los archivos afectados analizando el workspace completo, rutas absolutas o relativas dentro del repo. En caso que se deban generar archivos indica '(nuevo)'. Prioriza el código actual sobre archivos inventados.]

### 🧠 Contexto:
[Explica la necesidad real del cambio o creación. Menciona el flujo funcional al que pertenece]

### 📐 Objetivo:
[Qué se espera lograr, funcionalmente hablando. Debe tener foco en el usuario final]

### ✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- [ ] [Ej: El componente carga sin errores en consola]
- [ ] [Ej: El estado global se actualiza correctamente]
- [ ] [Ej: Se adapta a mobile y desktop]
- [ ] [Ej: Los datos ingresados persisten en base de datos]

### ❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- [ ] [Ej: El campo aparece vacío al volver]
- [ ] [Ej: Se muestra un valor por defecto no deseado]
- [ ] [Ej: No respeta el diseño responsivo]

### 🧪 QA / Casos de prueba esperados:
- [ ] [Ej: Cargar la vista desde Home → debería verse el selector con los tres rangos]
- [ ] [Ej: Seleccionar "3 a 5 años" → avanzar → volver atrás → debería persistir]
- [ ] [Ej: Forzar creación de cuento → el prompt generado debería incluir target_edad]

### Notas para devs:
[Información técnica específica, patrones a seguir, advertencias sobre conflictos]

### EXTRAS:
- [Ej: Se recomienda usar RadioGroup de Shadcn para accesibilidad]
- [Ej: Validar que el valor persiste en WizardContext]
```

---

## 🧠 Reglas Inteligentes para Creación de Issues

### ✅ **Auto-etiquetado por palabras clave**
**Detectar categoría automáticamente:**
- **bug:** "error", "falla", "regresión", "no funciona", "crash", "excepción"
- **feature:** "nuevo flujo", "agregar", "implementar", "crear funcionalidad"
- **improvement:** "optimizar", "mejorar", "performance", "UX", "accesibilidad"
- **refactor:** "refactor", "reestructurar", "limpiar código", "reorganizar"
- **docs:** "documentar", "guía", "README", "comentarios"
- **test:** "test", "prueba", "cypress", "cobertura"

### ✅ **Sugerir nombre del issue si falta**
**Formato:** `[CATEGORÍA]: Descripción breve y técnica`
- Ejemplos:
  - `FEATURE: Add age selector to story wizard`
  - `BUG: Character association fails with POST 409`
  - `IMPROVEMENT: Standardize modal loading states`

### ✅ **Formato del código**
- Todo bloque debe estar delimitado por ``` y especificar el lenguaje (js, ts, py, html…)
- Incluir contexto del archivo y líneas relevantes
- Mostrar "antes" y "después" cuando sea aplicable

### ✅ **Validación y mejora de código**
- Validar sintaxis antes de incluir en el issue
- Sugerir mejoras si el código no cumple con el objetivo
- Verificar que sigue las convenciones del proyecto (CLAUDE.md)

### ✅ **Solicitar impacto si está ausente**
Si no está claro a quién beneficia o qué mejora, preguntar:
> **"¿Qué esperas lograr con esta funcionalidad en términos del usuario final?"**

### ✅ **Relacionar issues si aplica**
- Si pertenece a una épica: `**Épica:** [nombre-epica]`
- Si depende de otro issue: `**Depende de:** #123`
- Si bloquea otro issue: `**Bloquea:** #456`

### ✅ **Notas técnicas cuando hay complejidad**
Incluir información técnica específica:
- Patrones a seguir del proyecto
- Consideraciones de performance
- Restricciones técnicas
- Ejemplos: "Usar debounce de 500ms para evitar sobrecarga en autosave"

### ✅ **Advertir sobre conflictos lógicos**
Si el issue contradice reglas anteriores del sistema:
> ⚠️ **ADVERTENCIA:** Este cambio podría afectar [flujo/regla existente]. Verificar impacto en [archivos/componentes].

---

## 🏷️ Labels Sugeridos para GitHub

### Por Prioridad:
- `high-priority` - Crítico para funcionalidad
- `medium-priority` - Importante pero no bloquea
- `low-priority` - Nice to have

### Por Categoría:
- `bug` - Error o comportamiento incorrecto
- `feature` - Nueva funcionalidad
- `enhancement` - Mejora de funcionalidad existente
- `refactor` - Reestructuración de código
- `docs` - Documentación
- `test` - Testing
- `ui-ux` - Interfaz y experiencia de usuario

### Por Componente:
- `wizard` - Sistema de wizard/flujo
- `character` - Gestión de personajes
- `database` - Operaciones de base de datos
- `auth` - Autenticación
- `ai-generation` - Generación con IA

### Por Esfuerzo:
- `good-first-issue` - Para nuevos desarrolladores
- `epic` - Issue grande que requiere múltiples PRs
- `quick-fix` - Solución rápida (<1 hora)

---

## 📋 Checklist para Crear Issues de Calidad

Antes de crear un issue, verificar:

- [ ] **Título claro y específico**
- [ ] **Categoría identificada correctamente**
- [ ] **Archivos afectados listados con rutas correctas**
- [ ] **Contexto explica el "por qué"**
- [ ] **Objetivo explica el "qué" desde perspectiva del usuario**
- [ ] **Criterios de éxito son verificables**
- [ ] **Criterios de falla previenen regresiones**
- [ ] **Casos de prueba son específicos y ejecutables**
- [ ] **Estimación de esfuerzo incluida**
- [ ] **Labels apropiados sugeridos**
- [ ] **Dependencias identificadas si las hay**

---

**Última actualización:** 2025-06-16  
**Uso:** Copiar template, completar secciones, crear issue en GitHub