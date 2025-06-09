Épica: WIZARD - [2] DISEÑO DE HISTORIA
Categoría: feature/*
Notas para devs: Agregar soporte para métricas de tokens cacheados de OpenAI

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/supabase/migrations/20250609040000_add_cached_tokens_to_prompt_metrics.sql (nuevo)
- /home/customware/lacuenteria/Lacuenteria/supabase/functions/_shared/metrics.ts
- /home/customware/lacuenteria/Lacuenteria/supabase/functions/generate-story/index.ts

🧠 Contexto:
Con la implementación del prompt caching en OpenAI, es importante poder monitorear cuántos tokens están siendo cacheados vs. procesados normalmente. Esto permite validar la efectividad del caching y calcular el ahorro real en costos (50% de descuento en tokens cacheados).

📐 Objetivo:
Agregar campos en la tabla prompt_metrics para registrar tokens cacheados y actualizar las funciones para capturar esta información de las respuestas de OpenAI.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- Se crean columnas tokens_entrada_cacheados y tokens_salida_cacheados en prompt_metrics
- La interfaz PromptMetric incluye los nuevos campos opcionales
- generate-story captura prompt_tokens_details.cached_tokens de la respuesta
- Los valores se registran correctamente en la base de datos
- Se mantiene compatibilidad con registros anteriores (campos opcionales)

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- No se rompe el registro de métricas existente
- No se pierden métricas si OpenAI no devuelve info de caching
- No se generan errores si los campos no existen en la respuesta
- No se afecta el rendimiento del registro de métricas

🧪 QA / Casos de prueba esperados:
- Generar historia → verificar que se registran tokens_entrada_cacheados
- Consultar prompt_metrics → ver nuevas columnas con valores
- Generar múltiples historias → validar incremento en tokens cacheados
- Verificar que tokens_salida_cacheados es 0 (OpenAI no cachea salida)

EXTRAS:
- OpenAI devuelve info de caching en usage.prompt_tokens_details.cached_tokens
- El caching solo aplica a prompts > 1024 tokens
- Los tokens cacheados tienen 50% de descuento
- Útil para dashboards de análisis de costos y optimización
