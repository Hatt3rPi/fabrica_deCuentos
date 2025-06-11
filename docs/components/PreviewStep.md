# 📱 PreviewStep

Paso del asistente para revisar las páginas generadas y permitir la regeneración de imágenes.

## 📋 Descripción

El `PreviewStep` muestra cada página del cuento con su imagen. El usuario puede editar el prompt asociado y regenerar la ilustración utilizando la función `generate-image_pages`.

## 🔧 Props

Este componente no recibe props; consume el `WizardContext` para obtener las páginas y el estado de generación.

## 🔄 Funcionalidades

1. Navegación entre páginas generadas.
2. Edición del prompt de la página actual.
3. Regeneración de la imagen mostrando un `OverlayLoader` mientras se procesa.
4. Notificaciones de éxito o error mediante el sistema de toasts.
