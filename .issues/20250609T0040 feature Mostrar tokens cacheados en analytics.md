Épica: Home
Categoría: feature/*
Notas para devs: Agregar columnas de tokens cacheados a las tablas de analytics existentes

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/src/pages/Admin/Analytics/PromptAnalytics.tsx
- /home/customware/lacuenteria/Lacuenteria/src/types/analytics.ts
- /home/customware/lacuenteria/Lacuenteria/src/services/analyticsService.ts

🧠 Contexto:
Ya se implementó el registro de tokens cacheados en la tabla prompt_metrics. Ahora necesitamos mostrar esta información en el dashboard de analytics para que los administradores puedan monitorear el ahorro generado por el prompt caching.

📐 Objetivo:
Permitir a los administradores visualizar los tokens cacheados en las diferentes secciones del dashboard de analytics, facilitando el análisis del impacto del prompt caching en costos y rendimiento.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

    La sección "Uso por modelo" muestra TODOS los modelos utilizados (no solo los que tienen más de una ejecución)

    La sección "Uso por modelo" incluye una columna "Tokens cacheados" con el total de tokens de entrada cacheados

    La sección "Rendimiento de Prompts" incluye columnas para tokens cacheados (total y promedio)

    La sección "Métricas por usuario" incluye columnas para tokens cacheados (total y promedio)

    Los valores de tokens cacheados se formatean correctamente con formatNumber()

    Las consultas SQL incluyen los campos tokens_entrada_cacheados y tokens_salida_cacheados

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

    No se filtran modelos con pocas ejecuciones (deben mostrarse todos)

    Los valores de tokens cacheados aparecen como undefined o null

    Se rompe la funcionalidad existente de filtrado por fechas

    Las tablas pierden su diseño responsivo

🧪 QA / Casos de prueba esperados:

    Navegar a /admin/analytics → todas las tablas deben cargar sin errores

    Sección "Uso por modelo" → debe mostrar todos los modelos usados con su columna de tokens cacheados

    Generar un cuento con un modelo que soporte caching → los tokens cacheados deben aparecer en analytics

    Filtrar por rango de fechas → los tokens cacheados deben actualizarse correctamente

    Verificar que los totales y promedios de tokens cacheados sean coherentes

EXTRAS:

    Para "Uso por modelo": cambiar la consulta para usar SELECT DISTINCT o GROUP BY sin filtrar por cantidad de ejecuciones

    Considerar agregar un indicador de ahorro estimado (tokens cacheados * 0.5 = ahorro en tokens)

    Los tokens de salida cacheados siempre serán 0 (OpenAI no cachea respuestas)

    Usar el mismo formato de columnas que las existentes para mantener consistencia visual
