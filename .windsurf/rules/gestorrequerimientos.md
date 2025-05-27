---
trigger: always_on
---

# 🧠 Configuración personalizada para generación de Issues en WindSurf

---

## 📁 Estructura de almacenamiento

- Todos los issues deben guardarse como archivos `.md` dentro de la carpeta `.issues`.
- Formato de nombre del archivo: `{timestamp} {Categoría} {Nombre}.md`  
  Ejemplo: `20250520T1400 feature/Selector de edad.md`

---

## 🗂 Categorías disponibles

- `feature/*`: Nuevas funcionalidades.
- `improvement/*`: Mejoras no funcionales, refactor, rendimiento, cambios de estructura.
- `bug/*`: Corrección de errores o regresiones detectadas.

---

## 🧱 Épicas de trabajo

- `Login`  
- `Home`  
- `WIZARD - [1] CREACIÓN DE PERSONAJE`  
- `WIZARD - [2] DISEÑO DE HISTORIA`  
- `WIZARD - [3] VISUALIZACIÓN`  
- `WIZARD - [4] EXTRAS`  
- `CARRITO DE COMPRAS`  
- `DESPACHO`  

---

## ✍️ Proceso de generación de Issues

1. El usuario escribe una necesidad, idea o problema.
2. El agente analiza si la información es suficiente.
   - Si **NO es suficiente**, el agente debe hacer preguntas específicas para destrabar.
   - Si **SÍ es suficiente**, completa el template estructurado.
3. Se debe analizar cualquier bloque de código incluido:
   - Validar sintaxis.
   - Comentar mejoras.
   - Verificar alineación con el objetivo planteado.

4. Si no se detecta un objetivo claro, preguntar explícitamente:  
   **“¿Qué esperas lograr con esta funcionalidad en términos del usuario final?”**

---

## 📄 Template estandarizado para Issues

Épica:
Categoría:
Notas para devs:

Archivos afectados:
[Identifica los archivos afectados analizando el workspace completo, rutas absolutas o relativas dentro del repo. En caso que se deban generar archivos indica '(nuevo)'. Prioriza el código actual sobre archivos inventados.]

🧠 Contexto:
[Explica la necesidad real del cambio o creación. Menciona el flujo funcional al que pertenece]

📐 Objetivo:
[Qué se espera lograr, funcionalmente hablando. Debe tener foco en el usuario final]

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

    [Ej: El componente carga sin errores en consola]

    [Ej: El estado global se actualiza correctamente]

    [Ej: Se adapta a mobile y desktop]

    [Ej: Los datos ingresados persisten en base de datos]

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

    [Ej: El campo aparece vacío al volver]

    [Ej: Se muestra un valor por defecto no deseado]

    [Ej: No respeta el diseño responsivo]

🧪 QA / Casos de prueba esperados:

    [Ej: Cargar la vista desde Home → debería verse el selector con los tres rangos]

    [Ej: Seleccionar “3 a 5 años” → avanzar → volver atrás → debería persistir]

    [Ej: Forzar creación de cuento → el prompt generado debería incluir target_edad]

EXTRAS:

    [Ej: Se recomienda usar RadioGroup de Shadcn para accesibilidad]

    [Ej: Validar que el valor persiste en WizardContext]


---

## 🧠 Reglas adicionales inteligentes

✅ **Auto-etiquetado por palabras clave**  
- Detecta si es un `bug`, `feature` o `improvement` según palabras como:  
  “error”, “falla”, “regresión”, “nuevo flujo”, “optimizar”, “refactor”.

✅ **Sugerir nombre del issue si falta**  
- Si no se define uno, crear uno breve, claro y técnico.

✅ **Formato del código**  
- Todo bloque debe estar delimitado por ``` y especificar el lenguaje (js, ts, py, html…).

✅ **Validación y mejora de código**  
- Validar sintaxis y sugerir mejoras si el código no cumple con el objetivo declarado.

✅ **Solicitar impacto si está ausente**  
- Si no está claro a quién beneficia o qué mejora, preguntar:  
  **“¿Qué esperas lograr con esta funcionalidad en términos del usuario final?”**

✅ **Relacionar issues si aplica**  
- Si pertenece a una épica o depende de otro issue, relacionarlo explícitamente.

✅ **Notas técnicas cuando hay complejidad**  
- Ej: “Usar debounce de 500ms para evitar sobrecarga en autosave.”

✅ **Advertir sobre conflictos lógicos**  
- Si el issue contradice reglas anteriores del sistema, levantar una alerta en la sección “Notas para devs”.

✅ **Documentación actualizada**  
- Asegúrate de mantener siemple la documentación actualizada asociada al alcance del trabajo

---

Este archivo define las reglas base y el formato que debe seguir el agente para generar issues limpios, claros y alineados a las necesidades del equipo de desarrollo.