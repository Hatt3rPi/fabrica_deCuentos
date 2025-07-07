/**
 * Normaliza las URLs de storage para que funcionen correctamente tanto en desarrollo como en producción
 * En desarrollo, las Edge Functions pueden devolver URLs con "kong:8000" que necesitan ser reemplazadas
 * con la URL pública de Supabase
 */
export function normalizeStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // En desarrollo, reemplazar kong:8000 con la URL pública de Supabase
  if (url.includes('kong:8000')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      // Extraer el path después de kong:8000
      const path = url.split('kong:8000')[1];
      return `${supabaseUrl}${path}`;
    }
  }

  // En producción o si la URL ya es correcta, devolverla sin cambios
  return url;
}

/**
 * Normaliza un objeto que puede contener URLs de storage
 * Útil para respuestas de API que contienen múltiples URLs
 */
export function normalizeObjectUrls<T extends Record<string, unknown>>(obj: T): T {
  const normalized = { ...obj };
  
  // Lista de campos que típicamente contienen URLs de storage
  const urlFields = ['coverUrl', 'imageUrl', 'thumbnailUrl', 'url', 'image_url', 'cover_url', 'thumbnail_url'];
  
  for (const field of urlFields) {
    if (normalized[field] && typeof normalized[field] === 'string') {
      normalized[field] = normalizeStorageUrl(normalized[field]);
    }
  }
  
  return normalized;
}