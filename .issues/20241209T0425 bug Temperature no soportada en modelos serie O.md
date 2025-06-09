Épica: WIZARD - [2] DISEÑO DE HISTORIA
Categoría: bug/*
Notas para devs: Los modelos serie O tienen restricciones adicionales en los parámetros de la API

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/supabase/functions/generate-story/index.ts

🧠 Contexto:
Se detectó un nuevo error en producción con el modelo o4-mini: "Unsupported value: 'temperature' does not support 0.8 with this model. Only the default (1) value is supported". Los modelos de la serie O (o1, o3, o4) son más restrictivos y no permiten personalizar la temperatura, solo aceptan el valor por defecto.

📐 Objetivo:
Agregar manejo condicional del parámetro temperature para que solo se incluya en modelos que lo soporten, evitando errores con los modelos serie O.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- Los modelos serie O no incluyen el parámetro temperature en el payload
- Los demás modelos continúan usando temperature: 0.8
- La generación funciona correctamente con o4-mini
- No se rompe la compatibilidad con otros modelos

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- No debe fallar con error de "Unsupported value: temperature"
- No se debe perder la variabilidad creativa en modelos que sí soportan temperature
- No debe afectar la calidad de las historias generadas

🧪 QA / Casos de prueba esperados:
- Generar historia con o4-mini → debe funcionar sin error de temperature
- Generar historia con gpt-4o → debe continuar usando temperature: 0.8
- Verificar payload en logs → o4-mini no debe incluir temperature
- Verificar payload en logs → gpt-4o debe incluir temperature: 0.8

EXTRAS:
- Los modelos serie O son más determinísticos por diseño
- Esta restricción es adicional a la de max_completion_tokens
- Se mantiene la misma lógica de detección isOModel para consistencia
