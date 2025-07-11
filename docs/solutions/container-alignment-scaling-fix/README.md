# Fix: Sistema de Alineación y Escalado de Contenedores

## Problema Identificado
El sistema de alineación y escalado de contenedores no funcionaba visualmente en los componentes, aunque los valores se guardaban correctamente. Los usuarios reportaron:
1. "no se está alineando el componente a la opción marcada"
2. "no logro ampliar la imagen con las opciones entregadas"

## Análisis del Problema
Los logs mostraban que los valores se guardaban correctamente en `containerStyle`, pero tenían problemas de aplicación visual:

1. **Conflicto de `justifyContent`**: La lógica mezclaba alineación horizontal y vertical causando conflictos
2. **Estructura flexbox incorrecta**: El div necesitaba display: flex con dimensiones específicas
3. **Escalado no aplicado**: Las dimensiones no se aplicaban correctamente al contenido
4. **Soporte limitado en imágenes**: Las imágenes no tenían soporte completo para containerStyle

## Ubicación del Problema
- `/src/pages/Admin/StyleEditor/components/ComponentRenderer.tsx` - Renderizado visual
- `/src/hooks/useStyleAdapter.ts` - Mapeo de propiedades de contenedor para imágenes

## Archivos Modificados
1. `/src/pages/Admin/StyleEditor/components/ComponentRenderer.tsx`
2. `/src/hooks/useStyleAdapter.ts`

## Solución Implementada

### 1. Corrección de Sistema de Alineación para Texto

**ANTES (problemático):**
```typescript
// Conflicto: justifyContent se sobrescribía entre horizontal y vertical
if (containerStyle.horizontalAlignment) {
  alignmentStyles.justifyContent = 'flex-start'; // Se perdía con vertical
}
if (containerStyle.verticalAlignment) {  
  alignmentStyles.justifyContent = 'center'; // Sobrescribía horizontal
}
```

**DESPUÉS (corregido):**
```typescript
// Sistema unificado sin conflictos
if (containerStyle.horizontalAlignment || containerStyle.verticalAlignment) {
  alignmentStyles.display = 'flex';
  alignmentStyles.flexDirection = 'column';
  alignmentStyles.height = '100%';
  alignmentStyles.width = '100%';
  
  // Horizontal -> alignItems (eje X en flexbox column)
  if (containerStyle.horizontalAlignment) {
    switch (containerStyle.horizontalAlignment) {
      case 'left': alignmentStyles.alignItems = 'flex-start'; break;
      case 'center': alignmentStyles.alignItems = 'center'; break;
      case 'right': alignmentStyles.alignItems = 'flex-end'; break;
    }
  }
  
  // Vertical -> justifyContent (eje Y en flexbox column)  
  if (containerStyle.verticalAlignment) {
    switch (containerStyle.verticalAlignment) {
      case 'top': alignmentStyles.justifyContent = 'flex-start'; break;
      case 'center': alignmentStyles.justifyContent = 'center'; break;
      case 'bottom': alignmentStyles.justifyContent = 'flex-end'; break;
    }
  }
}
```

### 2. Corrección de Sistema de Escalado

**ANTES (problemático):**
```typescript
// Escalado que causaba overflow y problemas de layout
if (containerStyle.scaleWidth) {
  scaleStyles.width = widthValue; // Podía causar overflow
}
```

**DESPUÉS (corregido):**
```typescript
// Escalado mejorado con maxWidth y altura adaptativa
if (containerStyle.scaleWidth && containerStyle.scaleWidth !== '100') {
  const widthValue = containerStyle.scaleWidth + (containerStyle.scaleWidthUnit || '%');
  if (containerStyle.scaleWidthUnit === 'auto') {
    scaleStyles.width = 'auto';
  } else {
    scaleStyles.maxWidth = widthValue;
    scaleStyles.width = widthValue;
  }
}

if (containerStyle.scaleHeight && containerStyle.scaleHeight !== '100') {
  const heightValue = containerStyle.scaleHeight + (containerStyle.scaleHeightUnit || '%');
  if (containerStyle.scaleHeightUnit === 'auto') {
    scaleStyles.height = 'auto';
  } else {
    scaleStyles.minHeight = heightValue;
    // Para textos, escalar también el fontSize proporcionalmente
    if (containerStyle.scaleHeightUnit === 'px') {
      scaleStyles.fontSize = 'calc(' + (scaledStyles.fontSize || '2rem') + ' * ' + (parseInt(containerStyle.scaleHeight) / 100) + ')';
    }
  }
}
```

### 3. Soporte Completo para Imágenes

**Nuevo sistema de alineación para imágenes:**
```typescript
// Aplicar alineación a imágenes con flexbox
let imageAlignmentStyles: any = {};
if (containerStyle.horizontalAlignment || containerStyle.verticalAlignment) {
  imageAlignmentStyles.display = 'flex';
  imageAlignmentStyles.width = '100%';
  imageAlignmentStyles.height = '100%';
  
  // Alineación horizontal -> justifyContent (para imágenes)
  if (containerStyle.horizontalAlignment) {
    switch (containerStyle.horizontalAlignment) {
      case 'left': imageAlignmentStyles.justifyContent = 'flex-start'; break;
      case 'center': imageAlignmentStyles.justifyContent = 'center'; break;
      case 'right': imageAlignmentStyles.justifyContent = 'flex-end'; break;
    }
  }
  
  // Alineación vertical -> alignItems (para imágenes)
  if (containerStyle.verticalAlignment) {
    switch (containerStyle.verticalAlignment) {
      case 'top': imageAlignmentStyles.alignItems = 'flex-start'; break;
      case 'center': imageAlignmentStyles.alignItems = 'center'; break;
      case 'bottom': imageAlignmentStyles.alignItems = 'flex-end'; break;
    }
  }
}
```

**Escalado de imágenes mejorado:**
```typescript
// Aplicar escalado personalizado si existe
if (containerStyle.scaleWidth || containerStyle.scaleHeight) {
  if (containerStyle.scaleWidth) {
    const widthValue = containerStyle.scaleWidth + (containerStyle.scaleWidthUnit || '%');
    sizeStyles.width = containerStyle.scaleWidthUnit === 'auto' ? 'auto' : widthValue;
  }
  
  if (containerStyle.scaleHeight) {
    const heightValue = containerStyle.scaleHeight + (containerStyle.scaleHeightUnit || '%');
    sizeStyles.height = containerStyle.scaleHeightUnit === 'auto' ? 'auto' : heightValue;
  }
  
  if (containerStyle.maintainAspectRatio) {
    sizeStyles.aspectRatio = 'auto';
    sizeStyles.objectFit = 'contain';
  }
}
```

### 4. Integración en useStyleAdapter

**Agregado soporte para containerStyle en imágenes:**
```typescript
// En mapComponentStylesToUnified para imágenes
if (component.type === 'image') {
  const imgComp = component as ImageComponentConfig;
  return {
    // ... propiedades existentes
    // Nuevas propiedades de contenedor para imágenes
    horizontalAlignment: imgComp.containerStyle?.horizontalAlignment,
    verticalAlignment: imgComp.containerStyle?.verticalAlignment,
    scaleWidth: imgComp.containerStyle?.scaleWidth,
    scaleHeight: imgComp.containerStyle?.scaleHeight,
    scaleWidthUnit: imgComp.containerStyle?.scaleWidthUnit,
    scaleHeightUnit: imgComp.containerStyle?.scaleHeightUnit,
    maintainAspectRatio: imgComp.containerStyle?.maintainAspectRatio
  };
}

// En updateStyles para imágenes
if (selectedComponent?.type === 'image') {
  // ... updates de style existentes
  
  // Manejar updates de containerStyle para imágenes
  const containerStyleUpdates: any = {};
  if (updates.horizontalAlignment !== undefined) containerStyleUpdates.horizontalAlignment = updates.horizontalAlignment;
  if (updates.verticalAlignment !== undefined) containerStyleUpdates.verticalAlignment = updates.verticalAlignment;
  if (updates.scaleWidth !== undefined) containerStyleUpdates.scaleWidth = updates.scaleWidth;
  if (updates.scaleHeight !== undefined) containerStyleUpdates.scaleHeight = updates.scaleHeight;
  if (updates.scaleWidthUnit !== undefined) containerStyleUpdates.scaleWidthUnit = updates.scaleWidthUnit;
  if (updates.scaleHeightUnit !== undefined) containerStyleUpdates.scaleHeightUnit = updates.scaleHeightUnit;
  if (updates.maintainAspectRatio !== undefined) containerStyleUpdates.maintainAspectRatio = updates.maintainAspectRatio;
  
  if (Object.keys(containerStyleUpdates).length > 0) {
    componentUpdates.containerStyle = { ...(selectedComponent as ImageComponentConfig).containerStyle, ...containerStyleUpdates };
  }
}
```

## Funcionalidades Implementadas

### ✅ Dimensiones Base Fijas
- Sistema de coordenadas con base de 1536x1024 píxeles
- Coordenadas (0,0) en esquina superior izquierda

### ✅ Alineación Horizontal
- **Izquierda**: Alinea contenido al borde izquierdo del contenedor
- **Centro**: Centra contenido horizontalmente en el contenedor  
- **Derecha**: Alinea contenido al borde derecho del contenedor

### ✅ Alineación Vertical
- **Superior**: Alinea contenido al borde superior del contenedor
- **Centro**: Centra contenido verticalmente en el contenedor
- **Inferior**: Alinea contenido al borde inferior del contenedor

### ✅ Escalado de Contenido
- Controles de ancho y alto independientes
- Opciones de escalado: porcentaje, píxeles, ajuste automático
- Mantener proporciones habilitado/deshabilitado
- Calidad preservada al escalar imágenes dinámicas

## Debug Visual

Se agregaron bordes de debug para visualizar los contenedores con alineación activa:
```typescript
border: alignmentStyles.display ? '2px dashed rgba(128, 90, 213, 0.3)' : (originalBorder || 'none')
```

## Pruebas Recomendadas

### Para Componentes de Texto:
1. Seleccionar un componente de texto
2. Cambiar alineación horizontal (izquierda/centro/derecha)
3. Cambiar alineación vertical (superior/centro/inferior)
4. Ajustar escalado (ancho y alto)
5. Probar mantener proporción activado/desactivado

### Para Componentes de Imagen:
1. Seleccionar un componente de imagen
2. Cambiar alineación horizontal y vertical
3. Ajustar escalado con diferentes unidades (px, %, auto)
4. Verificar que se mantenga la calidad
5. Probar con diferentes tamaños de imagen

### Verificaciones de Funcionalidad:
1. Los valores se guardan correctamente en containerStyle
2. Los cambios se aplican visualmente en tiempo real
3. Los bordes de debug aparecen cuando hay alineación activa
4. El escalado funciona sin causar overflow
5. Las proporciones se mantienen cuando está habilitado

## Notas Técnicas

- Los logs de debugging contienen prefijo `[container]` para fácil identificación
- Los bordes de debug son sutiles (rgba con alpha 0.3) para no interferir
- El sistema usa flexbox para garantizar compatibilidad cross-browser
- El escalado de texto ajusta proporcionalmente el fontSize cuando se usan píxeles
- El maxWidth previene overflow en contenedores pequeños

## Performance

- Los estilos se calculan una sola vez por render
- No hay re-cálculos innecesarios en cada cambio
- Los updates son optimizados para cambiar solo propiedades modificadas
- El sistema es compatible con el auto-save existente