# Changelog

## Unreleased

### Fix: Error al Editar Prompts de Portada en Vista Previa (2025-06-22)
- **Issue reportado**: Error "Content-Type: application/json" y parpadeo al editar prompts de portada
  - **Causa**: `generateCoverImage` solo enviaba `story_id`, pero edge function requiere `visual_style` y `color_palette`
  - **storyService.ts**: Consultar parámetros de diseño antes de llamar `generate-cover`
  - **WizardContext.tsx**: Soporte para prompts personalizados en páginas regulares
  - **PreviewStep.tsx**: Eliminar timestamp dinámico que causaba parpadeo de imagen
  - **Resultado**: Edición de prompts funciona sin errores y sin parpadeo
  - **Documentación**: `/docs/solutions/fix-cover-prompt-edit-missing-params/README.md`

### Fix: Navigation 404 Errors (2025-06-21)
- **Issue #213 - Navigation 404 Errors**: Resueltos errores 404 intermitentes causados por patrones de navegación mixtos
  - **NotificationCenter.tsx**: Reemplazados `window.location.href` con `useNavigate()` para navegación consistente
  - **PageTransition.tsx**: Eliminado `preventDefault()` y setTimeout que causaban race conditions
  - **App.tsx**: Consolidado a un solo `AnimatePresence` para evitar conflictos de sincronización
  - **Resultado**: Navegación predecible y eliminación completa de errores 404 en sidebar y notificaciones
  - **Documentación**: `/docs/solutions/fix-navigation-404-errors/README.md`

### Optimizaciones Story Export (2025-06-21)
- **Query Optimization**: Optimizada consulta de páginas en `story-export/index.ts` líneas 215-220
  - Cambio de `select('*')` a `select('id, page_number, text, image_url')` para mejor rendimiento
  - Agregado campo de desempate `order('id')` para orden consistente de páginas
  - Implementada validación robusta de datos de páginas con filtering automático
  - Mejorado logging para debugging de páginas inválidas
  - Documentación actualizada en `/docs/tech/story-export.md`

## 2025-01-20 - Implementación completa de size/quality dinámico en edge functions
- **8 Edge Functions actualizadas**: Implementación estandarizada de configuración dinámica de size/quality
  - **Patrón A (BD + fallback)**: generate-cover, generate-story, generate-thumbnail-variant, generate-cover-variant
  - **Patrón B (env vars)**: generate-scene, generate-spreads, generate-variations (usan prompts dinámicos)
  - **Bug fixes**: Corregido error `refBlob` → `blob` en generate-thumbnail-variant
  - **Fallbacks unificados**: Estandarizado quality='standard' en todas las funciones
  - **Documentación completa** en `/docs/solutions/prompt-image-size-issue/`

## 2025-01-19 - Refactorización StoryReader
- **StoryReader.tsx**: Refactorizado componente de 414 líneas para mejorar mantenibilidad
  - Creados 4 custom hooks para separar responsabilidades: `useStoryData`, `useKeyboardNavigation`, `usePdfExport`, `useStoryStyles`
  - Agregadas optimizaciones de performance con `useCallback` y `useMemo`
  - Corregido edge case de renderizado de texto con null checks
  - Reducción del 40% en líneas de código del componente principal (414 → 247 líneas)
  - Documentación completa en `/docs/solutions/story-reader-refactor/`

## 2025-06-17 - Finalización y Exportación de Cuentos
- **Finalización de Cuentos con Exportación PDF**: Implementación completa de funcionalidad para finalizar cuentos y generar archivos PDF descargables. Incluye 3 fases: MVP Core, Edge Function Real, y Testing & Polish.
- **Edge Function `story-export`**: Nueva función para generar PDFs profesionales con HTML styling, metadatos completos, información de personajes, y todas las páginas del cuento. Integrada con Supabase Storage.
- **Base de Datos Expandida**: Nuevos campos `completed_at`, `export_url`, `exported_at` en tabla `stories` con índices optimizados. Bucket `exports` con políticas RLS para almacenamiento seguro.
- **UI Mejorada en Vista Previa**: Sección de finalización con indicadores de progreso dinámicos, modal rediseñado con feedback visual profesional, y validación de páginas completas.
- **Testing Comprehensivo**: Suite completa de tests Cypress para flujo end-to-end desde creación hasta exportación, incluyendo manejo de errores y persistencia de estado.
- **Sistema de Fallback**: Mecanismo robusto que usa mock export si Edge Function falla, garantizando funcionalidad siempre disponible.
- **Opciones de Biblioteca**: Funcionalidad "guardar en biblioteca personal" con persistencia y acceso desde perfil de usuario.
- Documentado en Issue #193 y PR #197.

- **Generación Paralela de Imágenes**: Implementada generación asíncrona concurrente para todas las páginas de Vista Previa con indicador de progreso en tiempo real. Reduce el tiempo total de generación en 60-80% y mejora significativamente la UX con feedback granular ("3 de 8 páginas completadas"). Incluye sistema de reintento inteligente para páginas fallidas y estados visuales por página individual. Documentado en Issue #194 y PR #195.
- Vista de Prompts muestra badges con las Edge Functions que utilizan cada template y permite filtrarlos por función. Documentado en `docs/components/PromptAccordion.md`.
- Los badges de Edge Function utilizan colores pasteles distintos para cada tipo.
- Portada principal desbloquea el paso de Diseño sin esperar las variantes. Los mensajes de `stories.loader` ahora se usan en el `OverlayLoader` mientras se genera la portada.
- Nueva función `generate-image-pages` para generar o regenerar ilustraciones de páginas y edición en `PreviewStep`. Documentado en `docs/tech/generate-image-pages.md` y `docs/components/PreviewStep.md`.
- `generate-image-pages` ahora aplica automáticamente el estilo seleccionado y las imágenes de referencia de los personajes.
- Corregido el parámetro `quality` de OpenAI cambiando `hd` por `high` en las funciones de generación de imágenes.
- Al editar prompts de imagen se pueden ajustar tamaño y calidad (OpenAI) o ancho y alto (Flux).
- Se corrige `generatePageImage` para incluir `story_id` en la solicitud y asegurar la actualización de imágenes de las páginas.
- Added `generate-story` Edge Function for story creation and cover generation.
- UI now displays generated covers on home.
- Documentation added at `docs/tech/story-generation.md`.
- Wizard state now persists in Supabase and localStorage allowing users to resume drafts exactly where they left off. See `docs/flow/wizard-states.md`.
- Fixed a reference error when initializing `setStoryId` inside `WizardContext`.
- Admin panel now guarda la configuración de cada actividad y muestra métricas de los últimos 10 minutos.
- Nuevas columnas `actividad` y `edge_function` en `prompt_metrics`.
- Nueva función `generate-cover-variant` para crear variantes de portada y mostrarlas en el paso de diseño. Documentado en `docs/tech/generate-cover-variant.md` y `docs/components/DesignStep.md`.
- Nuevo componente `OverlayLoader` con mensajes rotativos, soporte de timeout y fallback tras un minuto. Integrado en las etapas del asistente. Documentado en `docs/components/OverlayLoader.md`.
- Las funciones Edge ahora imprimen en consola el JSON enviado a las APIs de IA.
- Se corrige `describe-and-sketch` para soportar Flux y definir la constante `FILE`.
- Corregida la conversión a base64 de la imagen de referencia en `describe-and-sketch`.
- El panel de Analytics ahora pagina las consultas a Supabase para considerar todos los registros y no solo los primeros 1000.
- Arreglado el reemplazo del placeholder `${sanitizedNotes}` en el prompt de `describe-and-sketch`.
- Las funciones que usan Flux ahora devuelven la imagen en base64 para evitar errores CORS al descargar la URL firmada.
- Nuevo helper `generateWithFlux` para conectar con Flux desde las Edge Functions.
- Todas las funciones de generación de imágenes detectan el uso de Flux y emplean este helper automáticamente.
- Nuevo helper `generateWithOpenAI` para centralizar las llamadas a la API de imágenes de OpenAI.
- `generate-story` y `generate-cover` ahora registran llamadas en `inflight_calls` para mostrarse como activas.
- `StageActivityCard` usa un gráfico de área apilada para visualizar éxitos y errores de la última hora. Ver `docs/components/StageActivityCard.md`.
- `generate-cover-variant` ahora recibe `storyId` y `styleKey`, guarda la imagen en Supabase y devuelve la URL pública.
- Se muestra la actividad **portada_variante** en `/admin/flujo` para controlar la generación de variantes de portada.
- `DesignStep` muestra un check en las tarjetas de estilo con portada disponible y avisa en la vista previa cuando la imagen aún se genera.
- Eliminada la sección de paleta de colores y se corrigieron las imágenes fallback con un helper para URLs optimizadas.
- Se corrigió un error de compilación renombrando `src/lib/image.ts` a `image.tsx` y se documentó el componente `OptimizedImage`.
