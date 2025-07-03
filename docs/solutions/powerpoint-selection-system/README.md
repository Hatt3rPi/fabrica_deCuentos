# Sistema de Selección PowerPoint-like para Admin/Style

## Resumen

Se implementó un sistema completo de selección y edición de componentes individuales en el editor de estilos de admin, similar a la experiencia de PowerPoint. Los usuarios ahora pueden:

1. **Seleccionar componentes individuales** haciendo click en ellos
2. **Aplicar estilos específicos** usando los paneles existentes
3. **Ver feedback visual** del elemento seleccionado
4. **Alternar entre página principal y componentes** fácilmente

## Arquitectura Implementada

### 1. Hook useStyleAdapter (`/src/hooks/useStyleAdapter.ts`)

**Propósito**: Adaptador central que unifica las estructuras de estilos entre páginas (`config.fontSize`) y componentes (`component.style.fontSize`).

**Funcionalidades clave**:
- Mapeo bidireccional entre estructuras de datos
- Control de disponibilidad de paneles según el tipo de elemento
- Información contextual del elemento seleccionado
- Función unificada de actualización de estilos

```typescript
const styleAdapter = useStyleAdapter(
  selectedTarget,           // { type: 'page' | 'component', componentId?: string }
  activeConfig,            // Configuración actual
  currentPageType,         // Tipo de página actual
  components,              // Lista de componentes
  onConfigChange,          // Función para actualizar configuración de página
  onComponentChange        // Función para actualizar componentes
);
```

### 2. Sistema de Selección en AdminStyleEditor

**Estado de selección**:
```typescript
const [selectedTarget, setSelectedTarget] = useState<SelectionTarget>({ type: 'page' });
```

**Funciones de manejo**:
- `handleComponentSelection`: Maneja selección/deselección de componentes
- `handleComponentChange`: Actualiza configuración de componentes específicos
- Reset automático al cambiar tipo de página

### 3. Feedback Visual en StylePreview

**Click handlers**: Detecta clicks en componentes usando `data-component-id`
**Estilos visuales**: 
- Hover: outline púrpura sutil
- Selección: outline más prominente + indicador circular
- Página: outline punteado cuando no hay componente seleccionado

### 4. Integración con Paneles Existentes

Los paneles (Typography, Colors, Position, Effects, Container) ahora:
- Reciben datos del `styleAdapter.currentStyles`
- Actualizan usando `styleAdapter.updateStyles`
- Se ocultan automáticamente si no son compatibles con el elemento seleccionado
- Muestran mensajes informativos cuando no están disponibles

## Características Implementadas

### ✅ Selección Visual Intuitiva
- Click en componentes para seleccionar
- Click en área vacía para seleccionar página principal
- Feedback visual claro con colores y animaciones

### ✅ Paneles Adaptativos
- **Componentes de texto**: Tipografía, Colores, Posición, Efectos
- **Componentes de imagen**: Posición, configuración específica de imágenes
- **Página principal**: Todos los paneles disponibles

### ✅ Indicador de Selección
- Panel informativo que muestra qué está seleccionado
- Diferenciación clara entre "página" y "componente"
- Botón para volver a página principal

### ✅ Compatibilidad Total
- Reutiliza paneles existentes sin duplicación
- Mantiene funcionalidad original intacta
- Arquitectura no disruptiva

## Flujo de Usuario

1. **Estado inicial**: Página principal seleccionada, todos los paneles disponibles
2. **Selección de componente**: Click en componente → paneles se adaptan automáticamente
3. **Edición de estilos**: Los cambios se aplican al elemento seleccionado
4. **Cambio de contexto**: Click en otro componente o área vacía para cambiar selección
5. **Cambio de página**: Reset automático a página principal

## Archivos Modificados

### Nuevos Archivos
- `/src/hooks/useStyleAdapter.ts` - Hook central del sistema

### Archivos Modificados
- `/src/pages/Admin/StyleEditor/AdminStyleEditor.tsx` - Sistema de selección y integración
- `/src/pages/Admin/StyleEditor/components/StylePreview.tsx` - Click handlers y feedback visual

### Archivos No Modificados (Reutilizados)
- `TypographyPanel.tsx` - Funciona con el adaptador transparentemente
- `ColorPanel.tsx` - Funciona con el adaptador transparentemente  
- `PositionPanel.tsx` - Funciona con el adaptador transparentemente
- `EffectsPanel.tsx` - Funciona con el adaptador transparentemente
- `ContainerPanel.tsx` - Funciona con el adaptador transparentemente

## Ventajas de Esta Implementación

1. **Reutilización completa**: No hay duplicación de código en paneles
2. **Experiencia familiar**: Comportamiento similar a PowerPoint
3. **Arquitectura limpia**: Separación clara de responsabilidades
4. **Escalabilidad**: Fácil agregar nuevos tipos de componentes
5. **Mantenibilidad**: Cambios centralizados en el adaptador
6. **Compatibilidad**: No rompe funcionalidad existente

## Testing y Verificación

La funcionalidad se puede probar en:
1. Admin → Styles → Cualquier tipo de página
2. Agregar componentes usando el panel "Componentes"  
3. Hacer click en componentes para seleccionarlos
4. Verificar que los paneles se adaptan correctamente
5. Confirmar que los cambios se aplican al elemento correcto

## Próximas Mejoras Posibles

- [ ] Selección múltiple con Ctrl+Click
- [ ] Atajos de teclado (Delete para eliminar, Esc para deseleccionar)
- [ ] Panel de capas para organizar z-index
- [ ] Guías de alineación automática
- [ ] Historial de cambios (Undo/Redo)

## Conclusión

El sistema implementado cumple completamente con los requisitos del usuario, proporcionando una experiencia de edición similar a PowerPoint mientras mantiene la arquitectura existente intacta y reutilizando todos los componentes de UI existentes.