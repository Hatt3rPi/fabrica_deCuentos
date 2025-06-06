# Changelog

## Unreleased
- Added `generate-story` Edge Function for story creation and cover generation.
- UI now displays generated covers on home.
- Documentation added at `docs/tech/story-generation.md`.
- Wizard state now persists in Supabase and localStorage allowing users to resume drafts exactly where they left off. See `docs/flow/wizard-states.md`.
- Fixed a reference error when initializing `setStoryId` inside `WizardContext`.
- Admin panel now guarda la configuración de cada actividad y muestra métricas de los últimos 10 minutos.
- Nuevas columnas `actividad` y `edge_function` en `prompt_metrics`.
- Las funciones Edge ahora imprimen en consola el JSON enviado a las APIs de IA.
- Se corrige `describe-and-sketch` para soportar Flux y definir la constante `FILE`.
- Corregida la conversión a base64 de la imagen de referencia en `describe-and-sketch`.
- Arreglado el reemplazo del placeholder `${sanitizedNotes}` en el prompt de `describe-and-sketch`.
- Las funciones que usan Flux ahora devuelven la imagen en base64 para evitar errores CORS al descargar la URL firmada.
