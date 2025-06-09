# 📱 DesignStep

Paso del asistente dedicado a la selección del estilo visual de la historia.

## 📋 Descripción

El `DesignStep` muestra las miniaturas de los personajes y, a partir de esta versión,
también presenta la portada generada en los distintos estilos. Las variantes de portada
se obtienen mediante la función `generate-cover-variant`.

## 🔧 Props

Este componente no recibe props directamente; utiliza los contextos `WizardContext` y `StoryContext`.

## 🔄 Funcionalidades

1. Selección de estilo visual.
2. Vista previa de la portada en el estilo seleccionado.
3. Las variantes de portada se generan en segundo plano y las imágenes se cargan de forma perezosa para agilizar la navegación.
4. Cada tarjeta de estilo muestra un pequeño check cuando la portada de ese estilo ya está disponible.
5. Si la portada aún no se genera, la vista previa mantiene una imagen de respaldo y un mensaje "Se está generando la vista previa, vuelve en un momento".
6. Se utilizan imágenes fallback cuando no existen miniaturas con estilo para los personajes.
7. Todas las imágenes se cargan con `getOptimizedImageUrl` para generar URLs eficientes.
