import React from 'react';

/**
 * Escala valores de estilo según el factor de escala
 * Convierte valores px/rem/em a valores escalados
 */
export function scaleStyleObject(styles: React.CSSProperties, scaleFactor: number): React.CSSProperties {
  const scaled: React.CSSProperties = {};
  
  const scaleValue = (value: string | number): string | number => {
    if (typeof value === 'number') {
      return value * scaleFactor;
    }
    
    if (typeof value === 'string') {
      // Manejar valores px
      if (value.endsWith('px')) {
        const num = parseFloat(value);
        return `${num * scaleFactor}px`;
      }
      
      // Manejar valores rem
      if (value.endsWith('rem')) {
        const num = parseFloat(value);
        return `${num * scaleFactor}rem`;
      }
      
      // Manejar valores em
      if (value.endsWith('em')) {
        const num = parseFloat(value);
        return `${num * scaleFactor}em`;
      }
      
      // Manejar valores de porcentaje (no escalar)
      if (value.endsWith('%')) {
        return value;
      }
      
      // Manejar valores especiales como 'auto', 'inherit', etc.
      return value;
    }
    
    return value;
  };
  
  for (const [key, value] of Object.entries(styles)) {
    switch (key) {
      case 'fontSize':
      case 'width':
      case 'height':
      case 'minWidth':
      case 'minHeight':
      case 'maxWidth':
      case 'maxHeight':
      case 'padding':
      case 'paddingTop':
      case 'paddingRight':
      case 'paddingBottom':
      case 'paddingLeft':
      case 'margin':
      case 'marginTop':
      case 'marginRight':
      case 'marginBottom':
      case 'marginLeft':
      case 'borderRadius':
      case 'borderWidth':
      case 'letterSpacing':
      case 'lineHeight':
      case 'gap':
      case 'rowGap':
      case 'columnGap':
        scaled[key] = scaleValue(value);
        break;
      
      case 'transform':
        // Escalar transformaciones
        if (typeof value === 'string' && value.includes('translate')) {
          scaled[key] = value.replace(/translate(X|Y)?\(([^)]+)\)/g, (match, axis, val) => {
            const scaledVal = scaleValue(val.trim());
            return `translate${axis || ''}(${scaledVal})`;
          });
        } else {
          scaled[key] = value;
        }
        break;
      
      case 'boxShadow':
      case 'textShadow':
        // Escalar sombras
        if (typeof value === 'string') {
          const parts = value.split(' ');
          const scaledParts = parts.map((part, index) => {
            // Los primeros 2-4 valores suelen ser dimensiones
            if (index < 4 && (part.endsWith('px') || part.endsWith('rem') || part.endsWith('em'))) {
              return scaleValue(part);
            }
            return part;
          });
          scaled[key] = scaledParts.join(' ');
        } else {
          scaled[key] = value;
        }
        break;
      
      default:
        // Para propiedades no escalables, mantener el valor original
        scaled[key] = value;
    }
  }
  
  return scaled;
}