# Changelog

## Unreleased

## [2025-07-02] - Fix: Acceso Público para Descarga de PDFs

### 🔧 Corrección
- **Problema**: Los usuarios no podían descargar sus cuentos en PDF debido a políticas RLS restrictivas
- **Solución**: Agregada política de lectura pública para el bucket `exports`
- **Resultado**: Los PDFs ahora se pueden descargar directamente sin autenticación

### 🗃️ Base de Datos
- Nueva política: "Public can read exports" para el bucket storage
- Permite operaciones SELECT (lectura) sin requerir autenticación
- Mantiene la seguridad al permitir solo lectura, no modificación

### 📄 Archivos
- `supabase/migrations/20250702084058_fix_exports_bucket_public_access.sql` - Migración de política
- `docs/solutions/fix-pdf-download-public-access/README.md` - Documentación completa

## [2025-07-01] - Flujo Completo de Compra Post-Pago

### ✨ Nuevas Funcionalidades
- **Fulfillment automático**: PDFs se generan automáticamente después del pago exitoso
- **Página "Mis Compras"**: Nueva página `/my-purchases` para gestionar historial de compras
- **Estado visual de compra**: Historias compradas muestran badge "Comprado" y botón "Descargar PDF"
- **Proceso de pago real**: Integración completa con base de datos para actualizar estado de órdenes
- **Suscripciones realtime**: UI se actualiza automáticamente cuando se completa el fulfillment

### 🔧 Mejoras Técnicas
- **Hook useOrderFulfillment**: Maneja automáticamente la generación de PDFs post-pago
- **Hook useStoryPurchaseStatus**: Verifica el estado de compra de historias individuales
- **Migración de BD**: Nuevos campos de tracking para fulfillment y PDFs
- **Función RPC**: `get_pending_fulfillment_orders()` para identificar órdenes pendientes

### 🎨 Mejoras de UX
- **CheckoutModal mejorado**: Feedback visual durante generación de PDFs
- **StoryCard inteligente**: Cambia comportamiento según estado de compra
- **Navegación mejorada**: Enlace "Mis Compras" en sidebar principal
- **Descarga directa**: PDFs accesibles desde múltiples puntos de la interfaz

### 🗃️ Base de Datos
- Nuevos campos en `orders`: `fulfillment_status`, `fulfilled_at`, `fulfillment_notes`
- Nuevos campos en `stories`: `pdf_url`, `pdf_generated_at`
- Índices optimizados para consultas de compras
- Función RPC para obtener órdenes pendientes de fulfillment

### 📋 Issues Creados
- **#298**: Implementar envío automático de correo con PDFs post-compra

### 🔗 Archivos Principales
- `src/hooks/useOrderFulfillment.ts` - Fulfillment automático
- `src/hooks/useStoryPurchaseStatus.ts` - Estado de compra
- `src/pages/MyPurchases.tsx` - Gestión de compras
- `src/components/StoryCard.tsx` - UI estado de compra
- `supabase/migrations/20250701120000_add_fulfillment_tracking.sql` - BD

---

### Fix: Filtro de usuario en "Mis cuentos" (2025-06-28)
- **Problema**: La página "Mis cuentos" no filtraba explícitamente por usuario, permitiendo que usuarios con roles admin/operator vean cuentos de otros usuarios
- **Solución**: Agregado filtro explícito `.eq('user_id', user?.id)` en la consulta de MyStories.tsx
- **Beneficio**: Garantiza que cada usuario solo vea sus propios cuentos, independientemente de sus roles

### Feature: Sistema Robusto de Roles de Usuario (2025-06-27)
- **Reemplazo de emails hardcodeados**: Sistema escalable de roles admin/operator/user
- **Base de Datos**:
  - Tabla `user_roles` con soporte para roles temporales y múltiples
  - Tabla `user_role_history` para auditoría completa de cambios
  - Vista `users_with_roles` optimizada para consultas eficientes
  - Funciones RPC: `has_role()`, `has_permission()`, `assign_role()`, `revoke_role()`
- **Sistema de Permisos Granular**:
  - Permisos específicos por funcionalidad (orders.view, config.admin, etc.)
  - Verificación centralizada en BD y frontend
  - Roles jerárquicos: admin > operator > user
- **Frontend**:
  - `UserRoleContext` para manejo de estado de roles
  - `useRoleGuard` hook para protección de componentes/rutas
  - `useRoleCheck` hook para verificaciones condicionales
  - Página `/admin/users` para gestión de roles con UI completa
- **Migración Automática**: Usuarios hardcodeados convertidos automáticamente a roles admin
- **Compatibilidad**: AdminContext mantiene retrocompatibilidad temporal
- **Auditoría**: Tracking completo de cambios con IP, timestamps y razones
- **Seguridad**: Políticas RLS actualizadas, validaciones y rate limiting

### Feature: Sistema de Gestión de Pedidos - Admin Fulfillment (2025-06-27)
- **Implementación Issue #263**: Nueva pantalla `/admin/pedidos` para gestión completa de pedidos de cuentos finalizados
- **Integrado con sistema de roles**: Accesible para admins y operadores
- **Separación de Estados**:
  - Campo `fulfillment_status` separado del wizard (`status`)
  - Estados: pendiente → imprimiendo → enviando → entregado / cancelado
  - Trigger automático asigna 'pendiente' cuando cuento se completa
- **Gestión Completa**:
  - Dashboard en tiempo real con estadísticas
  - Cambio de estados con historial de trazabilidad
  - Información completa de envío y tracking
  - Filtros por estado, búsqueda por texto, exportación CSV
- **Notificaciones**:
  - Nuevos pedidos aparecen en tiempo real
  - Badges con contadores en navegación (nuevos + pendientes)
  - Notificaciones browser nativas y toasts
  - Sistema de alertas para pedidos antiguos
- **Base de Datos**:
  - Tabla `fulfillment_history` para trazabilidad completa
  - Tabla `shipping_info` para datos de courier y direcciones
  - Vista `pedidos_view` optimizada para consultas admin
  - Función RPC `update_fulfillment_status` con historial automático
- **Componentes Principales**:
  - `AdminPedidos.tsx`: Página principal con dashboard
  - `TarjetaPedido.tsx`: Vista individual con acciones rápidas
  - `ModalEnvio.tsx`: Gestión completa de información de envío
  - `EstadisticasPedidos.tsx`: Dashboard de métricas en tiempo real
- **Servicios y Hooks**:
  - `fulfillmentService.ts`: API completa para gestión de pedidos
  - `useNotificacionesPedidos.ts`: Sistema de notificaciones en tiempo real
  - Funciones realtime para suscripciones a cambios
- **Documentación**: Completa en `/docs/tech/fulfillment-system.md` y `/docs/solutions/sistema-gestion-pedidos/`
- **Archivos de migración**: `20250627092838_add_fulfillment_tracking.sql`

### Feature: Sistema Completo de Configuración Admin de Dedicatoria (2025-06-27)
- **Implementación Issue #267**: Sistema completo de configuración administrativa para dedicatorias
- **Admin/Style Mejorado**:
  - Nueva sección "Dedicatoria" junto a "Portada" e "Interior"
  - Sistema de 3 imágenes específicas (portada, interior, dedicatoria)
  - Persistencia automática de imágenes custom en BD
  - Preview en tiempo real con imagen de fondo configurada
- **Restricciones de Usuario**: 
  - Solo opciones permitidas por admin (layouts, alineaciones)
  - Tamaño de imagen controlado por admin (read-only para usuario)
  - Hook `useDedicatoriaConfig` para obtener configuración automáticamente
- **Sistema de Imagen de Fondo**:
  - Admin configura imagen de fondo para todas las dedicatorias
  - Se usa en preview del wizard, PDF y visualización del cuento
  - Overlay automático y texto blanco para mejor legibilidad
- **Diferencia clave**: Imagen DE dedicatoria (usuario) vs Imagen DE FONDO (admin)
- **Archivos principales**: 
  - Admin: `AdminStyleEditor.tsx`, `StylePreview.tsx`, `styleConfigService.ts`
  - Usuario: `DedicatoriaStep.tsx`, `LayoutConfig.tsx`, `useDedicatoriaConfig.ts`
  - PDF: `story-export/index.ts`, StoryReader: `StoryReader.tsx`, `useStoryReader.ts`
- **Migraciones BD**: Nuevos campos para imágenes custom y URL de fondo
- **PR**: #273

### Fix: Dedicatoria Siempre Aparece en PDF (2025-06-26)
- **Problema resuelto**: Dedicatoria no aparecía en PDF cuando usuario elegía incluirla pero no escribía texto
- **Lógica corregida**: Edge Function ahora usa `dedicatoria_chosen` en lugar de solo `dedicatoria_text`
- **Casos soportados**:
  - Usuario elige "SÍ" + texto → aparece con texto personalizado
  - Usuario elige "SÍ" + solo imagen → aparece solo con imagen  
  - Usuario elige "SÍ" + nada → aparece página de dedicatoria reservada
  - Usuario elige "NO" → no aparece dedicatoria
- **Consistencia mejorada**: WizardContext carga dedicatoria basado en elección del usuario
- **Archivos**: `supabase/functions/story-export/index.ts`, `src/context/WizardContext.tsx`
- **Issue**: #267

### Feature: Sistema de Persistencia Inteligente (2025-06-25)
- **Nueva Arquitectura**: Reemplazado `useAutosave` por `usePersistence` con detección inteligente
  - **Detector de cambios reales**: Solo persiste cuando hay modificaciones significativas
  - **Modos contextuales**: Draft (1.5s), Review (3s), Final (solo metadatos seguros)
  - **Pausas automáticas**: 8 segundos durante export para evitar race conditions
  - **Respeto de estados finales**: Nunca sobrescribe `status: 'completed'`
- **Performance**: 80% menos escrituras innecesarias a BD
- **Fixes críticos**: 
  - Eliminada race condition que impedía activación de bloqueos Nivel 2
  - Preferencia de dedicatoria ahora visible al retroceder
- **Archivos**: `src/hooks/usePersistence.ts` (nuevo), `src/context/WizardContext.tsx`
- **Issues**: #271 (implementación), #266 (fix completo)

### Feature: Sistema de Bloqueo Incremental de Dos Niveles (2025-06-25)
- **Nueva Funcionalidad**: Sistema robusto de bloqueo progresivo en wizard
  - **Nivel 1**: Después de vista previa → bloquea personajes, cuento, diseño
  - **Nivel 2**: Después de PDF → bloquea dedicatoria-choice, dedicatoria, preview
  - **Hook centralizado**: `useWizardLockStatus` con localStorage backup
  - **Integración completa**: Todos los steps del wizard respetan los bloqueos
- **UX mejorada**: 
  - Íconos de candado y mensajes contextuales por nivel
  - Preferencias de dedicatoria visibles con checks verdes
  - Feedback visual inmediato en todos los estados
- **Archivos**: `src/hooks/useWizardLockStatus.ts`, componentes de wizard actualizados
- **PR**: #270

### Feature: Bloqueo de Edición Post-PDF (2025-06-25)
- **Nueva Funcionalidad**: Implementado sistema de bloqueo de edición de campos después de generar PDF
  - **Hook personalizado**: `useStoryCompletionStatus` para monitorear estado de completación desde BD
  - **DedicatoriaChoiceStep**: Botones "Sí/No" bloqueados con indicadores visuales cuando `story.status === 'completed'`
  - **DedicatoriaStep**: Todos los campos de dedicatoria bloqueados (texto, imagen, configuración de layout)
  - **PreviewStep**: Edición inline y modal avanzado deshabilitados, reemplazados con vista de solo lectura
  - **UX mejorada**: Íconos de candado, mensajes explicativos y estilos visuales diferenciados
  - **Real-time**: Escucha cambios de estado en tiempo real via Supabase subscriptions
- **Impacto**: Evita inconsistencias entre PDF generado y contenido en interfaz, mejora confiabilidad del sistema
- **Archivos**: `src/hooks/useStoryCompletionStatus.ts`, `src/components/Wizard/steps/DedicatoriaChoiceStep.tsx`, `src/components/Wizard/steps/DedicatoriaStep.tsx`, `src/components/Wizard/steps/PreviewStep.tsx`
- **Issue**: #266

### Feature: Mejoras al Panel Admin/Flujo (2025-06-24)
- **Nueva Funcionalidad**: Agregadas etapas faltantes Diseño y Vista Previa al panel de administración
  - **Etapa Diseño**: 
    - `generate-illustration`: Generar ilustraciones individuales de páginas
    - `generate-image-pages`: Generar páginas con múltiples personajes
  - **Etapa Vista Previa**:
    - `story-export`: Generar PDF final y marcar cuento como completado
  - **Contador de Usuarios Activos**: 
    - Muestra usuarios únicos en últimos 60 minutos
    - Actualización automática cada 10 segundos
    - Diseño con gradiente purple-to-blue
  - **Sistema de Control**: Los toggles permiten habilitar/deshabilitar edge functions
  - **Colores Actualizados**: Indigo para ilustraciones, rojo para exportación
- **Impacto**: Visibilidad completa del flujo de creación y mejor monitoreo de actividad
- **Archivos**: `src/pages/Admin/Flujo.tsx`, `src/constants/edgeFunctionColors.ts`
- **Issue**: #255
- **PR**: #258
- **Documentación**: `/docs/solutions/admin-flujo-mejoras/README.md`

### Fix: Mejora de Asignación de Imágenes de Referencia a Personajes (2025-06-24)
- **Problema Resuelto**: El endpoint `/images/edits` de OpenAI no asociaba correctamente las imágenes de referencia con los personajes mencionados en el prompt
- **Causa**: La API no proporciona mecanismo explícito para mapear imágenes a nombres específicos
- **Solución**: 
  - Obtención de nombres de personajes junto con sus thumbnails
  - Ordenamiento alfabético consistente de personajes
  - Nueva función `generateImageWithCharacters` para manejo especializado
  - Soporte completo para múltiples imágenes con `gpt-image-1` (hasta 16 imágenes)
  - Prompt enriquecido con mapeo explícito imagen-personaje
  - Corrección en FormData para usar formato `image[]` requerido por OpenAI
  - Logging mejorado para diagnóstico
- **Modelos soportados**: 
  - `gpt-image-1`: Acepta hasta 16 imágenes de referencia
  - `dall-e-2`: Limitado a una imagen de referencia
- **Impacto**: Mejora significativa en consistencia visual de personajes en historias multi-personaje
- **Archivos**: `supabase/functions/generate-image-pages/index.ts`, `supabase/functions/_shared/openai.ts`
- **Issue**: #247
- **Documentación**: `/docs/solutions/character-image-mapping/README.md`

### Fix: AdvancedEditModal Tab Reset en Regeneración (2025-06-23)
- **Problema Resuelto**: El modal de edición avanzada reseteaba automáticamente el tab activo a 'text' durante la regeneración de imágenes
- **Causa**: Hook useEffect dependía tanto de apertura modal como cambios en pageData, ejecutándose en ambos casos
- **Solución**: Separación de hooks useEffect para distinguir entre apertura de modal vs. actualizaciones de datos
- **Impacto**: Los usuarios pueden regenerar imágenes desde el tab 'prompt' sin ser interrumpidos
- **Archivos**: `AdvancedEditModal.tsx`
- **Documentación**: `/docs/solutions/advanced-modal-tab-reset-fix/README.md`

### Feature: Editor en Tiempo Real para Vista Previa (2025-06-23)
- **Nueva Funcionalidad**: Sistema completo de edición en tiempo real para contenido y prompts
  - **Editor Inline**: Doble-click sobre texto para edición directa con auto-save (2s)
  - **Botón Overlay**: Lápiz en esquina superior izquierda para acceso unificado a edición
  - **Modal Avanzado**: Editor completo con tabs para texto y prompts, vista previa y regeneración
  - **Persistencia Inteligente**: Debounce, estado local, indicadores visuales y manejo de errores
  - **Atajos de Teclado**: Enter/Escape/Ctrl+S para navegación fluida
  - **Estados Visuales**: Editando (amarillo), guardando (azul), guardado (verde), error (rojo)
  - **UX Simplificada**: Eliminados botones redundantes, flujo unificado de edición
  - **Componentes**: `InlineTextEditor`, `AdvancedEditModal`, hook `useRealTimeEditor`
  - **Servicios**: Métodos `updatePageText`, `updatePagePrompt`, `updatePageContent`
  - **Resultado**: Edición fluida sin interrupciones, feedback inmediato, interfaz más limpia
  - **Documentación**: `/docs/solutions/realtime-preview-editor/README.md`

### Enhancement: Mejoras de Edición de Portada y UX (2025-06-23)
- **Conexión Título-Portada**: Editar texto de portada actualiza automáticamente título del cuento
  - **handleSaveText**: Detecta página 0 y llama `updateStoryTitle(newText)`
  - **handleAdvancedSave**: Actualiza título cuando se edita texto de portada en modal
  - **Notificaciones específicas**: "Título actualizado" vs "Texto actualizado"
  - **Sincronización automática**: Cambios se reflejan en auto-save del wizard
  - **Resultado**: Ediciones de portada mantienen consistencia con título del cuento

- **Estado de Regeneración Específico**: Loader modal ya no se cierra prematuramente
  - **Nuevo estado**: `isRegeneratingModal` separado del global `isGenerating`
  - **WizardContext actualizado**: Nuevo estado en interfaz, declaración y provider
  - **AdvancedEditModal mejorado**: Usa estado específico para mejor timing
  - **Detección de carga**: `isImageLoading` rastrea cuando nueva imagen carga completamente
  - **Handlers de imagen**: `onLoad` y `onError` controlan estado de carga
  - **UI mejorada**: Mensajes diferenciados ("Generando..." vs "Cargando...")
  - **Botones inteligentes**: Deshabilitados durante regeneración Y carga de imagen
  - **Resultado**: Loader se mantiene visible hasta que imagen esté completamente cargada

- **Actualización Automática de Home**: Cambios se reflejan sin refresh manual
  - **Visibility API**: Recarga stories cuando usuario regresa a la página
  - **Focus events**: Detecta cuando ventana recupera foco
  - **Navigation tracking**: Recarga al navegar de vuelta a `/home`
  - **Polling inteligente**: Actualización cada 30s cuando página activa y enfocada
  - **Múltiples triggers**: visibilitychange, focus, location.pathname, intervalo
  - **Resultado**: Cambios de título/imagen de portada aparecen automáticamente en home

### Enhancement: Vista Previa con Display Dinámico (2025-06-23)
- **Mejora UX**: Implementada visualización dinámica en vista previa del wizard
  - **Aspect Ratios Dinámicos**: Las imágenes se adaptan automáticamente (landscape/portrait/square)
  - **Estilos de Template**: Texto renderizado con estilos del template configurado
  - **Posicionamiento Dinámico**: Texto posicionado según configuración (top/center/bottom)
  - **Responsive Design**: Container adaptativo con breakpoints optimizados
  - **PreviewStep.tsx**: Integración de `useStoryStyles` y `useImageDimensions` hooks
  - **Resultado**: Preview más fiel al resultado final, consistente con StoryReader
  - **Documentación**: `/docs/solutions/dynamic-preview-display/README.md`

### Fix: Error al Editar Prompts de Portada en Vista Previa (2025-06-22)
- **Issue reportado**: Error "Content-Type: application/json" y parpadeo al editar prompts de portada
  - **Causa**: `generateCoverImage` solo enviaba `story_id`, pero edge function requiere `visual_style` y `color_palette`
  - **storyService.ts**: Consultar parámetros de diseño antes de llamar `generate-cover`
  - **WizardContext.tsx**: Soporte para prompts personalizados en páginas regulares
  - **PreviewStep.tsx**: Eliminar timestamp dinámico que causaba parpadeo de imagen
  - **Resultado**: Edición de prompts funciona sin errores y sin parpadeo
  - **Documentación**: `/docs/solutions/fix-cover-prompt-edit-missing-params/README.md`

### Fix: Error al Editar Prompts en Vista Previa (2025-06-22)
- **Issue reportado**: Error "Faltan story_id o page_id" y parpadeo de imagen al editar prompts
  - **storyService.ts**: Añadido soporte para prompt personalizado en `generatePageImage`
  - **WizardContext.tsx**: Actualizada firma de función para aceptar prompt opcional
  - **PreviewStep.tsx**: Eliminado timestamp dinámico que causaba parpadeo de imagen
  - **Resultado**: Edición de prompts funciona correctamente para todas las páginas
  - **Documentación**: `/docs/solutions/fix-preview-prompt-edit/README.md`


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
