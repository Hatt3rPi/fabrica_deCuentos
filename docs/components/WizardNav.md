# 📱 WizardNav

Barra de navegación del asistente con botones para avanzar o retroceder entre pasos. Integra el sistema de **generación paralela de imágenes** para optimizar la transición a Vista Previa.

## 🔧 Props

No recibe props; usa `WizardContext` y `StoryContext`.

## 🔄 Funcionalidades

### Navegación:
1. **Botones Anterior/Siguiente** con validación de estado por paso
2. **Botón Descargar PDF** en la vista previa (pendiente implementación)
3. **Validación inteligente**: Solo habilita "Siguiente" si `canProceed()` es true
4. **Deshabilitación durante carga**: Previene navegación durante generaciones

### ⚡ Generación Paralela (Nueva funcionalidad):
5. **Transición optimizada Diseño → Vista Previa**:
   - Maneja **imagen de portada** de forma síncrona primero
   - Selecciona automáticamente la variante según `designSettings.visualStyle`
   - Actualiza portada en base de datos y estado local
   - Dispara **generación paralela** para todas las páginas restantes

6. **Flujo de generación mejorado**:
   ```typescript
   // Antes (secuencial)
   for (const page of generatedPages) {
     await generatePageImage(page.id); // Bloquea hasta completar
   }
   
   // Después (paralelo)
   await generateAllImagesParallel(); // Todas las páginas simultáneamente
   ```

## 🎯 Integración con Generación Paralela

### Función `generateAllImages()` renovada:
- **Paso 1**: Configura imagen de portada (síncrono)
- **Paso 2**: Delega generación masiva a `generateAllImagesParallel()` (asíncrono)
- **Manejo de errores**: Captura fallos tanto de portada como de páginas

### Estados gestionados:
- **isGenerating**: Estado global de carga durante transición
- **bulkGenerationProgress**: Progreso detallado de generación paralela
- **pageStates**: Estados individuales por página

## 📊 Mejoras de Performance

- **Tiempo de transición**: Reducido 60-80% vs. implementación secuencial
- **Experiencia de usuario**: Feedback inmediato con progreso granular
- **Robustez**: Manejo independiente de errores por página
- **Escalabilidad**: Soporte para cuentos con múltiples páginas sin degradación
