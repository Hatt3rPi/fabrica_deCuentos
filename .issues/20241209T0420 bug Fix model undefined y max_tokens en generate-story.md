Épica: WIZARD - [2] DISEÑO DE HISTORIA
Categoría: bug/*
Notas para devs: Corrección de errores en generate-story detectados en logs de producción

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/supabase/functions/generate-story/index.ts

🧠 Contexto:
Se detectaron dos errores críticos en los logs de producción de la función generate-story:
1. ReferenceError: model is not defined - La variable model no estaba definida en el scope del catch
2. Error con modelos serie O (o4-mini) - No soportan 'max_tokens', requieren 'max_completion_tokens'

📐 Objetivo:
Corregir ambos errores para asegurar el funcionamiento correcto de la generación de historias con todos los modelos soportados, especialmente los nuevos modelos de la serie O.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- La variable model está definida en todo el scope de la función
- Los modelos serie O (o1, o3, o4) usan max_completion_tokens
- Los demás modelos continúan usando max_tokens
- No se generan errores de referencia en el catch block
- Las métricas se registran correctamente incluso en caso de error

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- No debe haber ReferenceError por variables no definidas
- No debe fallar la generación con modelos de la serie O
- No se debe romper la compatibilidad con otros modelos
- No se deben perder métricas en caso de error

🧪 QA / Casos de prueba esperados:
- Generar historia con modelo o4-mini → debe funcionar sin error de max_tokens
- Generar historia con gpt-4o → debe continuar funcionando normalmente
- Forzar un error → verificar que se registran métricas sin ReferenceError
- Verificar logs → no deben aparecer errores de model undefined

EXTRAS:
- Se agregó detección dinámica del parámetro de tokens según el modelo
- La variable model se define al inicio con valor por defecto
- Los modelos de la serie O son más estrictos con los parámetros de la API
