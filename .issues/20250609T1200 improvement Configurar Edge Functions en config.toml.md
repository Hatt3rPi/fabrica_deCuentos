Épica: Home
Categoría: improvement/*
Notas para devs: Este issue ya fue implementado. IMPORTANTE: El archivo config.toml debe estar en /supabase/config.toml, NO en /supabase/supabase/config.toml

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/supabase/config.toml

🧠 Contexto:
En cada PR, Supabase mostraba un warning indicando que solo las funciones declaradas en config.toml serían desplegadas automáticamente. El mensaje específicamente mencionaba "[functions.my-slug]" como ejemplo, pero el problema real era que faltaban declarar todas las Edge Functions del proyecto.

📐 Objetivo:
Eliminar los warnings de Supabase en las PRs declarando todas las Edge Functions existentes en el archivo config.toml.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- Todas las Edge Functions del proyecto están declaradas en config.toml
- No aparecen warnings de Supabase sobre funciones no declaradas en las PRs
- Cada función tiene configuración básica (enabled, verify_jwt, timeout, max_request_size)
- La función send-reset-email tiene verify_jwt = false (no requiere autenticación)

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- Aparecen warnings de funciones no declaradas en las PRs
- Se declaran funciones que no existen en el proyecto
- Las funciones tienen configuración incorrecta de autenticación

🧪 QA / Casos de prueba esperados:
- Crear una nueva PR → No debe aparecer el warning de Supabase
- Verificar que todas las funciones en supabase/functions/ están en config.toml
- Confirmar que send-reset-email puede ejecutarse sin autenticación

EXTRAS:
- Se agregaron las siguientes funciones al config.toml:
  - analyze-character
  - delete-test-stories
  - describe-and-sketch
  - generate-cover
  - generate-cover-variant
  - generate-illustration
  - generate-scene
  - generate-spreads
  - generate-thumbnail-variant
  - generate-variations
  - send-reset-email
- La función "my-slug" del warning era solo un ejemplo y no existe en el proyecto
- Todas las funciones tienen timeout de 300 segundos y max_request_size de 10MB
