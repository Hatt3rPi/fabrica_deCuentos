# 📱 StoryStep

Paso del asistente para la creación y diseño de la historia.

## 📋 Descripción

El `StoryStep` es un componente que permite seleccionar el tema, estilo y estructura de la historia, además de personalizar los mensajes y diálogos.

## 🔧 Props

```typescript
interface StoryStepProps {
  onNext: () => void;
  onBack: () => void;
  characters: Character[];
  story: Story;
  setStory: (story: Story) => void;
}
```

## 🎨 Estilos

- Diseño responsive
- Tarjetas de selección
- Editor de texto enriquecido
- Previsualización en tiempo real

## 📊 Estado

- Estado de selección
- Estado de edición
- Estado de previsualización
- Manejo de errores

## 🔄 Funcionalidades

1. **Selección de Tema**
   - Lista de temas disponibles
   - Previsualización de temas
   - Selección de tema

2. **Estructura de la Historia**
   - Número de páginas
   - Distribución de contenido
   - Asignación de personajes

3. **Personalización**
   - Mensajes y diálogos
   - Estilo literario
 - Mensaje central

4. **Indicadores de Progreso**
   - Utiliza el `OverlayLoader` para mostrar los textos almacenados en `stories.loader` durante la generación de la portada.
   - Cambia cada 5 segundos hasta que finaliza la generación y se habilita el botón **Siguiente**.

## 🔗 Dependencias

### Consumidores

- `Wizard`: Componente principal del asistente

### Dependencias

1. **Contextos**
   - `WizardContext`: Estado del asistente
   - `StoryContext`: Estado de la historia

2. **Librerías**
   - `React Quill`: Editor de texto
   - `Framer Motion`: Animaciones
   - `Lucide Icons`: Iconos

## 🎯 Casos de Uso

### 1. Selección de Tema

#### Criterios de Éxito
- ✅ Mostrar temas disponibles
- ✅ Previsualizar tema
- ✅ Seleccionar tema
- ✅ Actualizar estado

#### Criterios de Fallo
- ❌ Tema no encontrado
- ❌ Error en previsualización
- ❌ Selección inválida

### 2. Estructura de la Historia

#### Criterios de Éxito
- ✅ Definir número de páginas
- ✅ Asignar personajes
- ✅ Distribuir contenido
- ✅ Actualizar estado

#### Criterios de Fallo
- ❌ Número de páginas inválido
- ❌ Asignación incorrecta
- ❌ Error en distribución

### 3. Personalización

#### Criterios de Éxito
- ✅ Editar mensajes
- ✅ Seleccionar estilo
- ✅ Definir mensaje central
- ✅ Actualizar estado

#### Criterios de Fallo
- ❌ Mensajes vacíos
- ❌ Estilo no válido
- ❌ Error en edición

## 🛠️ Contextos

- Utiliza `WizardContext` para el flujo
- Se integra con `StoryContext` para estado
- Usa `CharacterContext` para personajes

## 🐛 Consideraciones

- Validación de datos
- Manejo de estados
- Gestión de errores
- Previsualización en tiempo real
