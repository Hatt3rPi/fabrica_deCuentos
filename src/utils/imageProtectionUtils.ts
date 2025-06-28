/**
 * Utilidades para determinar qué imágenes necesitan protección
 */

export type ImageType = 'cover' | 'page' | 'thumbnail' | 'character' | 'background' | 'landing' | 'other';

interface ImageProtectionConfig {
  protectedTypes: ImageType[];
  publicTypes: ImageType[];
}

// Configuración de qué tipos de imágenes necesitan protección
const imageProtectionConfig: ImageProtectionConfig = {
  // Tipos que NECESITAN protección
  protectedTypes: [
    'page',  // Páginas internas del cuento (contenido premium)
  ],
  
  // Tipos que NO necesitan protección (públicos)
  publicTypes: [
    'cover',      // Portadas de cuentos
    'thumbnail',  // Miniaturas
    'character',  // Imágenes de personajes
    'background', // Fondos decorativos
    'landing',    // Imágenes del landing page
    'other',      // Otros elementos no sensibles
  ],
};

/**
 * Determina si una imagen necesita protección basándose en su tipo
 */
export function needsProtection(imageType: ImageType): boolean {
  return imageProtectionConfig.protectedTypes.includes(imageType);
}

/**
 * Determina el tipo de imagen basándose en la URL o contexto
 */
export function detectImageType(url: string, context?: { pageNumber?: number; isStoryPage?: boolean }): ImageType {
  // Si es una página del cuento (no la portada)
  if (context?.isStoryPage && context?.pageNumber && context.pageNumber > 0) {
    return 'page';
  }
  
  // Detectar por patrones en la URL
  if (url.includes('/covers/') || url.includes('page_0') || url.includes('cover')) {
    return 'cover';
  }
  
  if (url.includes('/thumbnails/') || url.includes('thumbnail')) {
    return 'thumbnail';
  }
  
  if (url.includes('/characters/') || url.includes('character')) {
    return 'character';
  }
  
  if (url.includes('/backgrounds/') || url.includes('background')) {
    return 'background';
  }
  
  if (url.includes('/images/') && (url.includes('landing') || url.includes('home'))) {
    return 'landing';
  }
  
  // Si es la página 0, es una portada
  if (url.includes('page_number=0') || url.includes('page-0')) {
    return 'cover';
  }
  
  return 'other';
}

/**
 * Componente de imagen inteligente que decide automáticamente si usar protección
 */
export function getImageComponent(url: string, context?: { pageNumber?: number; isStoryPage?: boolean }): 'ProtectedImage' | 'PublicImage' {
  const imageType = detectImageType(url, context);
  return needsProtection(imageType) ? 'ProtectedImage' : 'PublicImage';
}