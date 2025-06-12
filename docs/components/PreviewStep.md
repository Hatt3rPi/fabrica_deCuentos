# 📱 PreviewStep

Paso del asistente para revisar las páginas generadas y permitir la regeneración de imágenes.
Al avanzar desde el paso de **Diseño**, las ilustraciones de cada página se generan automáticamente.

## 📋 Descripción

El `PreviewStep` muestra cada página del cuento con su imagen. El usuario puede editar el prompt asociado y regenerar la ilustración utilizando la función `generate-image-pages`.

La página **1** corresponde siempre a la portada generada por la función `generate-story`. Las siguientes páginas se numeran de forma secuencial hasta la 9.

## 🔧 Props

Este componente no recibe props; consume el `WizardContext` para obtener las páginas y el estado de generación.

## 🔄 Funcionalidades

1. Navegación entre páginas generadas.
2. Edición del prompt de la página actual.
3. Regeneración de la imagen mostrando un `OverlayLoader` mientras se procesa.
4. Notificaciones de éxito o error mediante el sistema de toasts.
