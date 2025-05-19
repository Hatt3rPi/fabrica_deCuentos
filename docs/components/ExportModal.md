# 📱 ExportModal

Modal para la exportación del cuento en formato PDF.

## 📋 Descripción

El `ExportModal` es un componente que permite exportar el cuento generado en formato PDF, con opciones de personalización y seguimiento del proceso de exportación.

## 🔧 Props

```typescript
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
  characters: Character[];
  onExportComplete: (pdfUrl: string) => void;
}
```

## 🎨 Estilos

- Diseño modal responsive
- Opciones de personalización
- Indicadores de progreso
- Botones de acción

## 📊 Estado

- Estado de exportación
- Estado de progreso
- Estado de finalización
- Manejo de errores

## 🔄 Funcionalidades

1. **Personalización**
   - Selección de formato
   - Ajuste de margenes
   - Selección de orientación

2. **Exportación**
   - Generación de PDF
   - Optimización de imágenes
   - Progreso de exportación

3. **Descarga**
   - Preparación de archivo
   - Descarga automática
   - Gestión de errores

## 🔗 Dependencias

### Consumidores

- `PreviewBook`: Inicia el proceso de exportación
- `Wizard`: Gestiona el flujo

### Dependencias

1. **Contextos**
   - `WizardContext`: Estado del asistente
   - `StoryContext`: Estado de la historia
   - `ImageContext`: Estado de imágenes

2. **Librerías**
   - `PDF.js`: Generación de PDF
   - `Framer Motion`: Animaciones
   - `Lucide Icons`: Iconos

## 🎯 Casos de Uso

### 1. Personalización

#### Criterios de Éxito
- ✅ Seleccionar formato
- ✅ Ajustar margenes
- ✅ Seleccionar orientación
- ✅ Validar opciones

#### Criterios de Fallo
- ❌ Opciones inválidas
- ❌ Formato no soportado
- ❌ Error en validación

### 2. Exportación

#### Criterios de Éxito
- ✅ Generación de PDF
- ✅ Optimización de imágenes
- ✅ Progreso visible
- ✅ Archivo válido

#### Criterios de Fallo
- ❌ Error en generación
- ❌ Formato inválido
- ❌ Error en optimización

### 3. Descarga

#### Criterios de Éxito
- ✅ Preparación de archivo
- ✅ Descarga automática
- ✅ Mensaje de éxito
- ✅ Limpieza de estado

#### Criterios de Fallo
- ❌ Error en descarga
- ❌ Archivo no encontrado
- ❌ Error en limpieza

## 🛠️ Contextos

- Utiliza `WizardContext` para el flujo
- Se integra con `StoryContext` para estado
- Usa `ImageContext` para imágenes

## 🐛 Consideraciones

- Validación de datos
- Manejo de estados
- Gestión de errores
- Optimización de rendimiento
- Seguimiento de progreso
