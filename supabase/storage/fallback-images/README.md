# Imágenes de Respaldo por Estilo Visual

Este directorio contiene imágenes genéricas para cada estilo visual que se utilizan como respaldo cuando falla la generación de variantes personalizadas.

## Estilos Visuales

1. **Acuarela Digital** - `acuarela-digital.webp`
   - Dimensiones: 800x800px
   - Formato: WebP
   - URL pública: [URL_PUBLICA_ACUARELA_DIGITAL]

2. **Dibujado a mano** - `dibujado-a-mano.webp`
   - Dimensiones: 800x800px
   - Formato: WebP
   - URL pública: [URL_PUBLICA_DIBUJADO_A_MANO]

3. **Recortes de papel** - `recortes-de-papel.webp`
   - Dimensiones: 800x800px
   - Formato: WebP
   - URL pública: [URL_PUBLICA_RECORTES_DE_PAPEL]

4. **Kawaii** - `kawaii.webp`
   - Dimensiones: 800x800px
   - Formato: WebP
   - URL pública: [URL_PUBLICA_KAWAII]

## Uso en el Código

Para utilizar estas imágenes como respaldo en caso de fallo en la generación de variantes personalizadas:

```typescript
import { VisualStyle } from '../types/character';

// Mapeo de estilos visuales a URLs de imágenes de respaldo
const fallbackImages: Record<VisualStyle, string> = {
  'acuarela-digital': '[URL_PUBLICA_ACUARELA_DIGITAL]',
  'dibujado-a-mano': '[URL_PUBLICA_DIBUJADO_A_MANO]',
  'recortes-de-papel': '[URL_PUBLICA_RECORTES_DE_PAPEL]',
  'kawaii': '[URL_PUBLICA_KAWAII]'
};

// Función para obtener la URL de la imagen de respaldo según el estilo
export function getFallbackImageUrl(style: VisualStyle): string {
  return fallbackImages[style];
}
```

## Especificaciones Técnicas

- **Dimensiones**: 800x800 píxeles
- **Formato**: WebP (preferido) o PNG
- **Peso máximo**: 500KB por imagen
- **Paleta de colores**: Pasteles vibrantes
- **Estilo**: Coherente con cada categoría visual

## Notas Importantes

- Estas imágenes son genéricas pero representativas de cada estilo visual
- Se utilizan como respaldo cuando falla la generación de variantes personalizadas
- Las URLs públicas deben actualizarse una vez que las imágenes se hayan subido a Supabase Storage

