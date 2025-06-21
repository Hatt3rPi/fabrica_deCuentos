# Story Export System

## Resumen
Sistema completo para finalización de cuentos con exportación PDF real implementado en 3 fases desde MVP hasta producción.

## Arquitectura

### Edge Function: `story-export`
Ubicación: `supabase/functions/story-export/index.ts`

**Funcionalidades:**
- Generación de PDF desde HTML con styling profesional
- Integración completa con Supabase Storage
- Métricas y logging para monitoreo
- Manejo robusto de errores con timeouts
- Detección optimizada de aspect ratio de imágenes

**Flujo de Procesamiento:**
1. **Validación**: Autenticación de usuario y permisos
2. **Datos**: Obtención optimizada del cuento (story, pages, characters, design)
3. **Validación de Páginas**: Verificación de integridad de datos de páginas
4. **Detección de Aspect Ratio**: Análisis optimizado usando Range headers (solo 1KB)
5. **HTML**: Generación de contenido HTML con metadatos y styling dinámico
6. **PDF**: Conversión a PDF con Browserless.io
7. **Storage**: Subida a bucket `exports` con estructura organizada
8. **Database**: Actualización de estado completado con URLs

**Estructura de Storage:**
```
exports/
  {user_id}/
    story-{story_id}-{timestamp}.pdf
```

### Base de Datos

**Nuevos Campos en `stories`:**
- `completed_at`: TIMESTAMP WITH TIME ZONE - Cuándo se completó
- `export_url`: TEXT - URL del PDF en storage
- `exported_at`: TIMESTAMP WITH TIME ZONE - Cuándo se exportó

**Índices Optimizados:**
- `idx_stories_completion`: (status, completed_at) para queries de completados
- `idx_stories_export`: (status, exported_at) para queries de exportados

**Storage Bucket `exports`:**
- Bucket público para descarga directa
- RLS policies para acceso controlado por usuario
- Estructura organizada por user_id

### Service Layer

**`storyService.completeStory()`:**
- Usa Edge Function real como primary
- Fallback automático a mock export si falla
- Logging comprehensivo para debugging
- Manejo de errores con mensajes user-friendly

**Opciones de Exportación:**
```typescript
interface StoryExportRequest {
  story_id: string;
  save_to_library: boolean;
  format?: 'pdf' | 'epub' | 'web';
  include_metadata?: boolean;
}
```

## Optimizaciones de Performance

### Detección de Aspect Ratio con Range Headers (Junio 2025)
**Problema**: Descarga completa de imágenes (potencialmente varios MB) solo para leer primeros bytes y detectar dimensiones.

**Solución Implementada**: Usar HTTP Range headers para descargar solo el primer KB:
```typescript
// Optimización en detectImageAspectRatio()
const imageResponse = await fetch(imageUrl, {
  headers: { 'Range': 'bytes=0-1023' } // Solo primer KB
});
```

**Beneficios**:
- **PNG**: Solo necesita 24 bytes para obtener width/height
- **JPEG**: Máximo 600 bytes para encontrar marcador SOF con dimensiones
- **Reducción**: ~99% menos transferencia de datos en imágenes grandes
- **Fallback**: Automático si servidor no soporta Range headers

**Manejo de Respuestas**:
- `206 Partial Content`: Range soportado, datos parciales recibidos
- `200 OK`: Servidor no soporta Range, fallback a descarga completa
- `416 Range Not Satisfiable`: Rango inválido, retry sin Range

## Optimizaciones de Query (Junio 2025)

### Mejoras en Obtención de Páginas
La consulta de páginas del cuento fue optimizada en líneas 215-220 del archivo `story-export/index.ts`:

**Cambios Implementados:**
1. **Selección específica de campos**: Cambió de `select('*')` a `select('id, page_number, text, image_url')`
   - Mejora el rendimiento al transferir solo los datos necesarios
   - Los campos `prompt`, `created_at`, `updated_at` no se usan en la exportación

2. **Ordenamiento mejorado**: Agregó campo de desempate `order('id', { ascending: true })`
   - Garantiza orden consistente en caso de empates en `page_number`
   - Previene variaciones en el orden de páginas entre ejecuciones

3. **Validación de datos**: Implementó validación robusta de páginas
   - Verifica que existan páginas antes de proceder
   - Valida que cada página tenga `page_number`, `text` e `image_url` válidos
   - Filtra páginas inválidas en lugar de fallar completamente
   - Proporciona logging detallado para debugging

**Beneficios:**
- Mejor rendimiento en consultas de base de datos
- Mayor robustez ante datos incompletos o corruptos
- Orden consistente de páginas en el PDF final
- Logging mejorado para troubleshooting

**Query Optimizada:**
```typescript
const { data: pages, error: pagesError } = await supabaseAdmin
  .from('story_pages')
  .select('id, page_number, text, image_url')
  .eq('story_id', storyId)
  .order('page_number', { ascending: true })
  .order('id', { ascending: true }); // Campo de desempate
```

## Generación de PDF

### Contenido Incluido
- **Portada**: Título, imagen de portada, fecha de creación
- **Metadatos** (opcional): Información del cuento, personajes, configuración
- **Páginas**: Todas las páginas con texto e ilustraciones
- **Styling**: CSS profesional con tipografía y layout optimizado

### HTML Template
- Responsive design con breakpoints apropiados
- Print-optimized CSS con page-break controls
- Soporte para imágenes con fallbacks
- Tipografía legible y jerarquía visual clara

### Future Enhancements
- Integración con Puppeteer para PDF real
- Soporte para múltiples formatos (EPUB, Web)
- Templates personalizables por usuario
- Optimización de imágenes para tamaño de archivo

## Estados y UX

### Validación Previa
- Todas las páginas deben tener imágenes generadas
- Estados de página verificados (no 'error' o 'generating')
- Usuario autenticado y con permisos

### Feedback Visual
- Indicador de progreso de páginas completadas
- Modal con estados de procesamiento
- Confirmación visual de éxito con link de descarga
- Manejo de errores con mensajes específicos

### Persistencia
- Estado completado persiste en base de datos
- URL de descarga accesible desde perfil usuario
- Integración con biblioteca personal

## Monitoreo y Métricas

### Logging
- Métricas completas en tabla `prompt_metrics`
- Tracking de tiempo de respuesta y éxito/error
- Metadatos incluyen tamaño de archivo y formato
- Edge Function activity tracking

### Error Handling
- Fallback automático a mock export
- Retry logic en storage operations
- User-friendly error messages
- Detailed logging para debugging

## Testing

### Cypress Tests
Ubicación: `cypress/e2e/story_completion_flow.cy.js`

**Cobertura:**
- Flujo completo desde creación hasta exportación
- Validación de todas las páginas completadas
- Proceso de finalización con modal
- Descarga y verificación de PDF
- Manejo de errores y cancelación
- Persistencia de estado completado

**Test Scenarios:**
- Happy path completo
- Error handling y fallbacks
- Cancelación de proceso
- Estado persistido tras reload

## Configuración

### Environment Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase Configuration
```toml
[functions.story-export]
enabled = true
verify_jwt = true
```

## Deployment

### Migraciones Requeridas
1. `20250617171000_add_story_completion.sql` - Campo completed_at
2. `20250617172000_add_export_fields.sql` - Campos de export  
3. `20250617173000_create_exports_bucket.sql` - Storage bucket

### Edge Function Deployment
```bash
supabase functions deploy story-export
```

### Verificación
- Edge Function responsiva en dashboard
- Storage bucket creado con policies
- Migraciones aplicadas correctamente
- Tests pasando en CI/CD

## Troubleshooting

### Errores Comunes
1. **"completed_at column not found"**: Aplicar migración de completion
2. **Storage permission denied**: Verificar RLS policies de bucket exports
3. **Edge Function timeout**: Revisar tamaño de imágenes y optimizar
4. **PDF generation failed**: Fallback automático a mock debería funcionar

### Debugging
- Revisar logs de Edge Function en dashboard Supabase
- Verificar métricas en tabla `prompt_metrics`
- Comprobar storage bucket y archivos subidos
- Validar estado de páginas en `pageStates`