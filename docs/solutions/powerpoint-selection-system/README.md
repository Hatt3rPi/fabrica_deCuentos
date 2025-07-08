# Sistema de Selección PowerPoint para Editor de Estilos

## Resumen

Implementa un sistema de selección visual tipo PowerPoint para el editor de estilos en admin, permitiendo seleccionar y editar componentes individuales con feedback visual intuitivo.

## Problema

El editor de estilos original solo permitía editar configuraciones de página completa, sin la capacidad de seleccionar y editar componentes individuales dentro de una página.

## Solución Implementada

### 1. Hook useStyleAdapter

Crea una capa de adaptación entre las estructuras de datos de página y componentes:

```typescript
const styleAdapter = useStyleAdapter(
  selectedTarget,     // { type: 'page' | 'component', componentId?: string }
  activeConfig,       // Configuración actual
  currentPageType,    // Tipo de página actual
  components,         // Lista de componentes
  onConfigChange,     // Actualizar configuración de página
  onComponentChange   // Actualizar componentes
);
```

### 2. Sistema de Selección Visual

- **Click en componentes**: Selección automática con feedback visual
- **Click en área vacía**: Vuelve a seleccionar la página principal
- **Indicadores visuales**: Outline púrpura con animaciones suaves

### 3. Paneles Adaptativos

Los paneles se adaptan automáticamente según el elemento seleccionado:
- **Componentes de texto**: Tipografía, Colores, Posición, Efectos
- **Componentes de imagen**: Posición y configuración específica
- **Página principal**: Todos los paneles disponibles

## Archivos Modificados

- `src/hooks/useStyleAdapter.ts` - Hook principal del sistema
- `src/pages/Admin/StyleEditor/AdminStyleEditor.tsx` - Integración del sistema
- `src/pages/Admin/StyleEditor/components/StylePreview.tsx` - Click handlers y feedback visual

## Características Clave

### Feedback Visual

```css
/* Hover sobre componentes */
[data-component-id]:hover {
  outline: 2px solid rgba(147, 51, 234, 0.3);
  background-color: rgba(147, 51, 234, 0.05);
}

/* Componente seleccionado */
[data-component-id="${selectedComponentId}"] {
  outline: 2px solid rgba(147, 51, 234, 0.8);
  box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.2);
}
```

### Flujo de Datos

1. Usuario hace click en componente
2. `handleComponentSelection` actualiza `selectedTarget`
3. `useStyleAdapter` mapea estilos para el elemento seleccionado
4. Paneles reciben estilos unificados
5. Actualizaciones se aplican al elemento correcto

## Beneficios

- **UX Familiar**: Experiencia similar a PowerPoint
- **No Disruptivo**: Mantiene compatibilidad con funcionalidad existente
- **Reutilización**: Usa paneles existentes sin duplicación
- **Escalable**: Fácil agregar nuevos tipos de componentes

## Uso

1. Navegar a Admin → Styles
2. Click en cualquier componente para seleccionarlo
3. Los paneles se adaptarán automáticamente
4. Click en área vacía para volver a editar la página

## Nuevas Funcionalidades Agregadas

### 🎯 Panel de Elementos (Componentes)
- **Agregar nuevos elementos**: Textos e imágenes personalizadas
- **Presets inteligentes**: Plantillas para casos comunes
- **Gestión visual**: Ver, ocultar, eliminar elementos

### 📝 Tipos de Elementos

#### Elementos de Texto
- **Autor del libro**: "Por [Nombre del Autor]"
- **Subtítulo**: Texto secundario personalizable
- **Texto libre**: Completamente personalizable

#### Elementos de Imagen
- **Logo/Marca**: Imagen fija (subida por admin)
- **Imagen de referencia**: Imagen dinámica (reemplazada por usuario)
- **Imagen libre**: Personalizable completamente

### 🎨 Propiedades de Imagen
- **Fija**: La imagen se mantiene siempre igual
- **Dinámica**: Se reemplaza con la imagen del usuario
- **Posición**: Top, center, bottom / left, center, right
- **Tamaño**: Small, medium, large, custom
- **Ajuste**: Cover, contain, fill, scale-down, none

## Casos de Uso Implementados

### ✅ Portada
- Agregar autor del libro en la parte inferior
- Posicionar logo/marca en esquina superior derecha
- Subtítulo personalizable

### ✅ Dedicatoria
- Imagen de referencia dinámica (usuario verá su imagen aquí)
- Textos adicionales personalizables

### ✅ Página Interior
- Elementos decorativos
- Textos complementarios

## Flujo de Usuario Completo

1. **Ir a Admin → Styles**
2. **Click en tab "Elementos"** (primera pestaña)
3. **Click "Agregar"** para abrir modal
4. **Seleccionar tipo**: Texto o Imagen
5. **Elegir preset** o crear personalizado
6. **Confirmar** → Se agrega y selecciona automáticamente
7. **Editar estilos** usando otros tabs (Tipografía, Colores, etc.)
8. **Posicionar** usando controles de posición

## Estado

✅ Implementado y funcional con gestión completa de elementos