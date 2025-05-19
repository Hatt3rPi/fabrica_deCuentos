# 📱 PreviewBook

Componente para la previsualización del cuento en formato libro.

## 📋 Descripción

El `PreviewBook` es un componente que muestra una vista previa interactiva del cuento en formato libro, permitiendo la visualización página por página y la generación de imágenes finales.

## 🔧 Props

```typescript
interface PreviewBookProps {
  story: Story;
  characters: Character[];
  onGenerateImages: () => void;
  onExport: () => void;
}
```

## 🎨 Estilos

- Diseño de libro interactivo
- Animaciones de página
- Previsualización de imágenes
- Controles de navegación

## 📊 Estado

- Estado de previsualización
- Estado de generación
- Estado de exportación
- Manejo de errores

## 🔄 Funcionalidades

1. **Navegación**
   - Página por página
   - Zoom y rotación
   - Marcadores de posición

2. **Visualización**
   - Vista previa de texto
   - Previsualización de imágenes
   - Efectos de página

3. **Generación**
   - Generación de imágenes
   - Optimización de formato
   - Ajustes finales

## 🔗 Dependencias

### Consumidores

- `Wizard`: Componente principal del asistente
- `ExportModal`: Modal de exportación

### Dependencias

1. **Contextos**
   - `WizardContext`: Estado del asistente
   - `StoryContext`: Estado de la historia
   - `ImageContext`: Estado de imágenes

2. **Librerías**
   - `Framer Motion`: Animaciones
   - `PDF.js`: Generación de PDF
   - `Lucide Icons`: Iconos

## 🎯 Casos de Uso

### 1. Navegación

#### Criterios de Éxito
- ✅ Navegar entre páginas
- ✅ Zoom y rotación
- ✅ Marcadores de posición
- ✅ Controles visibles

#### Criterios de Fallo
- ❌ Página fuera de rango
- ❌ Error en zoom
- ❌ Control no encontrado

### 2. Visualización

#### Criterios de Éxito
- ✅ Mostrar texto correctamente
- ✅ Mostrar imágenes
- ✅ Efectos de página
- ✅ Actualización en tiempo real

#### Criterios de Fallo
- ❌ Texto no visible
- ❌ Imagen no cargada
- ❌ Error en efectos

### 3. Generación

#### Criterios de Éxito
- ✅ Generación de imágenes
- ✅ Optimización de formato
- ✅ Ajustes finales
- ✅ Preparación para exportación

#### Criterios de Fallo
- ❌ Error en generación
- ❌ Formato inválido
- ❌ Ajustes incorrectos

## 🛠️ Contextos

- Utiliza `WizardContext` para el flujo
- Se integra con `StoryContext` para estado
- Usa `ImageContext` para imágenes

## 🐛 Consideraciones

- Validación de datos
- Manejo de estados
- Gestión de errores
- Optimización de rendimiento
