# 📱 PreviewStep

Paso del asistente para revisar las páginas generadas y permitir la regeneración de imágenes.
Al avanzar desde el paso de **Diseño**, las ilustraciones de cada página se generan automáticamente mediante **generación paralela asíncrona**.

## 📋 Descripción

El `PreviewStep` muestra cada página del cuento con su imagen. El usuario puede editar el prompt asociado y regenerar la ilustración utilizando la función `generate-image-pages`.

La página **1** corresponde siempre a la portada generada por la función `generate-story`. Las siguientes páginas se numeran de forma secuencial hasta la 9.

## ⚡ Generación Paralela

**Nueva funcionalidad (Issue #194)**: Al transitar desde Diseño a Vista Previa, todas las páginas se generan de forma **asíncrona y concurrente** en lugar de secuencial:

- **60-80% reducción** en tiempo total de generación
- **Progress tracking en tiempo real**: "3 de 8 páginas completadas"
- **Estados visuales individuales** por página (generando/completada/error)
- **Sistema de reintento inteligente** para páginas fallidas

## 🔧 Props

Este componente no recibe props; consume el `WizardContext` para obtener las páginas y el estado de generación.

## 🔄 Funcionalidades

### Generación y Navegación:
1. **Generación paralela automática** al acceder por primera vez
2. **Navegación entre páginas** generadas con indicadores de estado
3. **Progress tracking visual** durante generación masiva
4. **Indicadores de estado por página**: generando (🔄), completada (✅), error (❌)

### Regeneración Individual:
5. **Edición del prompt** de la página actual
6. **Regeneración individual** mostrando un `OverlayLoader` mientras se procesa
7. **Notificaciones de éxito o error** mediante el sistema de toasts

### Manejo de Errores:
8. **Retry selectivo**: Botón para reintentar solo páginas fallidas
9. **Aislamiento de errores**: Fallos individuales no afectan otras páginas
10. **Fallback de imágenes**: Placeholder para imágenes rotas o no disponibles

## 🎯 Estados de Progreso

El componente maneja varios estados de progreso a través del `WizardContext`:

```typescript
// Estados individuales por página
pageStates: Record<string, 'pending' | 'generating' | 'completed' | 'error'>

// Progreso global de generación masiva
bulkGenerationProgress: {
  total: number;      // Total de páginas a generar
  completed: number;  // Páginas completadas exitosamente
  failed: number;     // Páginas que fallaron
  inProgress: string[]; // IDs de páginas generándose actualmente
}
```

## 🔗 Integración

### Con WizardContext:
- `generateAllImagesParallel()`: Generación concurrente de todas las páginas
- `retryFailedPages()`: Reintento selectivo de páginas fallidas
- `bulkGenerationProgress`: Estado de progreso en tiempo real
- `pageStates`: Estados individuales por página

### Con OverlayLoader:
- Etapa `vista_previa_parallel` para mensajes específicos
- Progress props para mostrar "X de Y páginas completadas"
- Context interpolation para contenido dinámico

## 📊 Performance

- **Antes**: Generación secuencial (una página por vez)
- **Después**: Generación paralela (todas las páginas simultáneamente)
- **Mejora esperada**: 60-80% reducción en tiempo total
- **UX**: Feedback inmediato vs. espera ciega
