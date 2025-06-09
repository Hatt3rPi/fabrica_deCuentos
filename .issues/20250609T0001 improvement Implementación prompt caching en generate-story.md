Épica: WIZARD - [2] DISEÑO DE HISTORIA
Categoría: improvement/*
Notas para devs: Optimización de la función generate-story con prompt caching

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/supabase/functions/generate-story/index.ts

🧠 Contexto:
Se implementó prompt caching en la función generate-story para optimizar la latencia y reducir costos en las llamadas a OpenAI. El prompt de generación de cuentos es largo (>1024 tokens) y tiene una estructura que permite separar contenido estático de variable.

📐 Objetivo:
- Reducir latencia en la generación de historias mediante prompt caching
- Disminuir costos aprovechando el descuento del 50% en tokens cacheados
- Mantener la funcionalidad existente mientras se optimiza el rendimiento

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- El prompt se estructura con contenido estático primero y variable al final
- Se incluye el parámetro `user` con el userId en las llamadas a OpenAI
- La parte estática del prompt (instrucciones) se separa de la variable (personajes/tema)
- El prompt final mantiene el formato esperado por el modelo
- La generación de historias continúa funcionando correctamente

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- No se rompe el formato JSON esperado en la respuesta
- No se pierden las instrucciones del prompt original
- No se alteran los personajes o temas proporcionados
- No se generan errores en la llamada a OpenAI

🧪 QA / Casos de prueba esperados:
- Generar historia con 1 personaje → debe funcionar y usar caching
- Generar historia con múltiples personajes → debe mantener formato correcto
- Generar múltiples historias con mismo usuario → debe aprovechar cache
- Verificar en logs que el prompt se estructura correctamente

EXTRAS:
- El prompt caching se activa automáticamente para prompts > 1024 tokens
- OpenAI cachea las partes estáticas del prompt por hasta 1 hora
- El descuento del 50% aplica a los tokens cacheados
- La estructura óptima es: instrucciones estáticas + datos variables al final
