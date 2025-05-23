/**
 * Constantes para los estilos visuales disponibles en la aplicación
 */

/**
 * Enum para los estilos visuales
 */
export enum VisualStyle {
  ACUARELA_DIGITAL = 'acuarela-digital',
  DIBUJADO_A_MANO = 'dibujado-a-mano',
  RECORTES_DE_PAPEL = 'recortes-de-papel',
  KAWAII = 'kawaii',
}

/**
 * Nombres de visualización para los estilos visuales
 */
export const VISUAL_STYLE_NAMES: Record<VisualStyle, string> = {
  [VisualStyle.ACUARELA_DIGITAL]: 'Acuarela Digital',
  [VisualStyle.DIBUJADO_A_MANO]: 'Dibujado a mano',
  [VisualStyle.RECORTES_DE_PAPEL]: 'Recortes de papel',
  [VisualStyle.KAWAII]: 'Kawaii',
};

/**
 * Descripciones de los estilos visuales
 */
export const VISUAL_STYLE_DESCRIPTIONS: Record<VisualStyle, string> = {
  [VisualStyle.ACUARELA_DIGITAL]: 'Estilo suave con bordes difuminados y mezcla de colores pasteles vibrantes.',
  [VisualStyle.DIBUJADO_A_MANO]: 'Trazos visibles con textura de lápiz o pluma en colores pasteles vibrantes.',
  [VisualStyle.RECORTES_DE_PAPEL]: 'Aspecto de capas superpuestas con sombras suaves en colores pasteles vibrantes.',
  [VisualStyle.KAWAII]: 'Estilo adorable con formas redondeadas y ojos grandes en colores pasteles vibrantes.',
};

/**
 * URLs de las imágenes de respaldo para cada estilo visual
 * Estas URLs deben actualizarse una vez que las imágenes se hayan subido a Supabase Storage
 */
export const FALLBACK_IMAGES: Record<VisualStyle, string> = {
  [VisualStyle.ACUARELA_DIGITAL]: '/supabase/storage/fallback-images/acuarela-digital.webp',
  [VisualStyle.DIBUJADO_A_MANO]: '/supabase/storage/fallback-images/dibujado-a-mano.webp',
  [VisualStyle.RECORTES_DE_PAPEL]: '/supabase/storage/fallback-images/recortes-de-papel.webp',
  [VisualStyle.KAWAII]: '/supabase/storage/fallback-images/kawaii.webp',
};

/**
 * Función para obtener la URL de la imagen de respaldo según el estilo
 * @param style Estilo visual
 * @returns URL de la imagen de respaldo
 */
export function getFallbackImageUrl(style: VisualStyle): string {
  return FALLBACK_IMAGES[style];
}

/**
 * Lista de todos los estilos visuales disponibles
 */
export const ALL_VISUAL_STYLES = Object.values(VisualStyle);

