Épica: Home
Categoría: improvement/*
Notas para devs: Se requiere actualizar la UI para mostrar correctamente los modelos de texto vs imagen vs audio. Los modelos tienen diferentes endpoints según su tipo.

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/src/constants/aiProviderCatalog.ts (modificado)
- /home/customware/lacuenteria/Lacuenteria/src/components/Prompts/PromptAccordion.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Prompts/PromptForm.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Admin/PromptEditor.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Layout/Sidebar.tsx

🧠 Contexto:
El sistema actualmente solo registra modelos de imagen de OpenAI en el catálogo de proveedores (dall-e-2, dall-e-3, gpt-image-1), pero las funciones edge ya utilizan modelos de texto como gpt-4-turbo para generar historias y analizar personajes. Esta inconsistencia hace que no se puedan seleccionar modelos de texto desde la UI, aunque el backend ya los soporta. Además, OpenAI ha lanzado nuevos modelos como GPT-4.1 (incluyendo nano, mini), serie O (o1, o3, o4), y modelos de audio.

📐 Objetivo:
Permitir que los usuarios puedan seleccionar y utilizar todos los modelos disponibles de OpenAI desde la interfaz de usuario, incluyendo:
- Modelos de texto (GPT-4.1 nano/mini/standard, GPT-4.5, serie O, GPT-3.5, etc.)
- Modelos de imagen (gpt-image-1, DALL-E 2/3)
- Modelos de audio (GPT-4o audio/realtime preview)

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- Los modelos de texto aparecen en los selectores de modelo de la UI
- Se puede distinguir visualmente entre modelos de texto, imagen y audio
- Los prompts de tipo texto pueden usar modelos de texto
- Los prompts de tipo imagen mantienen su funcionalidad con modelos de imagen
- El catálogo incluye todos los modelos actuales de OpenAI
- Se respetan los diferentes endpoints según el tipo de modelo

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- No se mezclan modelos de texto en prompts de imagen
- No se rompe la funcionalidad existente de generación de imágenes
- No se permite seleccionar modelos incompatibles con el tipo de prompt
- No se muestran errores en consola al cargar los componentes
- No se usan endpoints incorrectos para cada tipo de modelo

🧪 QA / Casos de prueba esperados:
- Navegar a Admin → Prompts → debería mostrar todos los nuevos modelos en el selector
- Editar un prompt de tipo PROMPT_GENERADOR_CUENTOS → debería permitir seleccionar GPT-4.1 nano
- Editar un prompt de tipo PROMPT_CUENTO_PORTADA → NO debería mostrar modelos de texto o audio
- Crear una nueva historia → debería usar el modelo de texto configurado
- Verificar en la base de datos que se guarda correctamente el modelo seleccionado
- Verificar que los modelos legacy (davinci-002, babbage-002) usan el endpoint /completions
- Verificar que los modelos de audio no aparecen en selectores de texto/imagen

EXTRAS:
- Considerar agregar badges o iconos para diferenciar tipos de modelos (📝 texto, 🎨 imagen, 🔊 audio)
- GPT-4.1 nano es el modelo más económico de la nueva generación ($0.10 entrada, $0.40 salida)
- Los modelos instruct y legacy usan endpoint /completions, no /chat/completions
- Los modelos de audio usan endpoints específicos (/audio/speech, /realtime)
- Documentar en README.md todos los nuevos modelos soportados y sus casos de uso
