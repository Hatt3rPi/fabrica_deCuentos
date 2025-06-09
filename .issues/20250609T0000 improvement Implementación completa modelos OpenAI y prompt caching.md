Épica: WIZARD - [2] DISEÑO DE HISTORIA
Categoría: improvement/*
Notas para devs: Implementación completada del soporte completo de modelos OpenAI y prompt caching

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/src/types/index.ts
- /home/customware/lacuenteria/Lacuenteria/src/components/UI/ModelBadge.tsx (nuevo)
- /home/customware/lacuenteria/Lacuenteria/src/utils/modelHelpers.ts (nuevo)
- /home/customware/lacuenteria/Lacuenteria/src/components/Prompts/PromptAccordion.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Prompts/PromptForm.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Admin/PromptEditor.tsx
- /home/customware/lacuenteria/Lacuenteria/src/constants/promptMetadata.ts
- /home/customware/lacuenteria/Lacuenteria/supabase/functions/generate-story/index.ts

🧠 Contexto:
Se implementó el soporte completo para todos los modelos de OpenAI actuales, incluyendo GPT-4.1 nano, GPT-4.5 preview, serie O, modelos de audio y legacy. También se optimizó la generación de historias con prompt caching para reducir latencia y costos.

📐 Objetivo:
- Permitir el uso de todos los modelos actuales de OpenAI en el sistema
- Mejorar la experiencia de selección de modelos con badges visuales
- Implementar prompt caching para optimizar rendimiento y costos
- Mantener compatibilidad con el sistema existente

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- El tipo OpenAIModel incluye todos los modelos del catálogo
- Los componentes de selección muestran badges de tipo de modelo
- Los modelos se filtran correctamente según el tipo de prompt
- Los endpoints se actualizan dinámicamente según el modelo
- La función generate-story incluye el parámetro user para prompt caching
- Los valores por defecto usan modelos modernos (gpt-4o para texto, gpt-image-1 para imagen)
- El build del proyecto se completa sin errores

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- No se mezclan modelos de texto en prompts de imagen
- No aparecen errores en consola al seleccionar modelos
- No se pierden configuraciones existentes
- No se rompe la compatibilidad con prompts guardados

🧪 QA / Casos de prueba esperados:
- Crear un nuevo prompt de texto → debe mostrar solo modelos de texto
- Crear un prompt de imagen → debe mostrar solo modelos de imagen
- Seleccionar un modelo legacy → debe mostrar endpoint /v1/completions
- Editar un prompt existente → debe mantener modelo y endpoint
- Generar una historia → debe usar el parámetro user en la llamada API

EXTRAS:
- Los modelos legacy (davinci-002, babbage-002) usan el endpoint /v1/completions
- Los modelos de audio tienen endpoints especializados (/v1/audio/speech, /v1/realtime)
- El prompt caching se activa automáticamente para prompts > 1024 tokens
- Se recomienda estructurar prompts con contenido estático al inicio
- Se mantiene gpt-image-1 como modelo de imagen por defecto para compatibilidad
