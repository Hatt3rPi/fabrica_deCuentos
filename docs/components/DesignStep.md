# 📱 DesignStep

Paso del asistente dedicado a la selección del estilo visual y la paleta de colores de la historia.

## 📋 Descripción

El `DesignStep` muestra las miniaturas de los personajes y, a partir de esta versión,
también presenta la portada generada en los distintos estilos. Las variantes de portada
se obtienen mediante la función `generate-cover-variant`.

## 🔧 Props

Este componente no recibe props directamente; utiliza los contextos `WizardContext` y `StoryContext`.

## 🔄 Funcionalidades

1. Selección de estilo visual y paleta de colores.
2. Vista previa de la portada en el estilo seleccionado.
3. Las variantes de portada se generan en segundo plano y las imágenes se cargan de forma perezosa para agilizar la navegación.
