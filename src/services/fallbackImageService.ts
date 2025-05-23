import { VisualStyle, FALLBACK_IMAGES } from '../constants/visualStyles';
import { supabase } from '../lib/supabase'; // Asumiendo que existe este archivo para la conexión con Supabase

/**
 * Servicio para manejar las imágenes de respaldo
 */
export const FallbackImageService = {
  /**
   * Obtiene la URL pública de la imagen de respaldo para un estilo visual específico
   * @param style Estilo visual
   * @returns Promesa con la URL pública de la imagen
   */
  async getPublicUrl(style: VisualStyle): Promise<string> {
    try {
      // Obtener la URL pública desde Supabase Storage
      const { data, error } = await supabase.storage
        .from('fallback-images')
        .getPublicUrl(`${style}.webp`);

      if (error) {
        console.error('Error al obtener la URL pública:', error);
        // Retornar la URL local como respaldo
        return FALLBACK_IMAGES[style];
      }

      return data.publicUrl;
    } catch (error) {
      console.error('Error en el servicio de imágenes de respaldo:', error);
      // Retornar la URL local como respaldo
      return FALLBACK_IMAGES[style];
    }
  },

  /**
   * Verifica si todas las imágenes de respaldo están disponibles
   * @returns Promesa con un objeto que indica qué imágenes están disponibles
   */
  async checkAvailability(): Promise<Record<VisualStyle, boolean>> {
    const availability: Record<VisualStyle, boolean> = {
      [VisualStyle.ACUARELA_DIGITAL]: false,
      [VisualStyle.DIBUJADO_A_MANO]: false,
      [VisualStyle.RECORTES_DE_PAPEL]: false,
      [VisualStyle.KAWAII]: false,
    };

    try {
      // Listar los archivos en el bucket de imágenes de respaldo
      const { data, error } = await supabase.storage
        .from('fallback-images')
        .list();

      if (error) {
        console.error('Error al verificar la disponibilidad de imágenes:', error);
        return availability;
      }

      // Verificar qué imágenes están disponibles
      data.forEach((file) => {
        const fileName = file.name;
        Object.values(VisualStyle).forEach((style) => {
          if (fileName === `${style}.webp`) {
            availability[style] = true;
          }
        });
      });

      return availability;
    } catch (error) {
      console.error('Error al verificar la disponibilidad de imágenes:', error);
      return availability;
    }
  },

  /**
   * Obtiene todas las URLs públicas de las imágenes de respaldo
   * @returns Promesa con un objeto que contiene las URLs públicas de todas las imágenes
   */
  async getAllPublicUrls(): Promise<Record<VisualStyle, string>> {
    const urls: Record<VisualStyle, string> = {
      [VisualStyle.ACUARELA_DIGITAL]: FALLBACK_IMAGES[VisualStyle.ACUARELA_DIGITAL],
      [VisualStyle.DIBUJADO_A_MANO]: FALLBACK_IMAGES[VisualStyle.DIBUJADO_A_MANO],
      [VisualStyle.RECORTES_DE_PAPEL]: FALLBACK_IMAGES[VisualStyle.RECORTES_DE_PAPEL],
      [VisualStyle.KAWAII]: FALLBACK_IMAGES[VisualStyle.KAWAII],
    };

    try {
      // Obtener las URLs públicas para cada estilo
      await Promise.all(
        Object.values(VisualStyle).map(async (style) => {
          const url = await this.getPublicUrl(style);
          urls[style] = url;
        })
      );

      return urls;
    } catch (error) {
      console.error('Error al obtener todas las URLs públicas:', error);
      return urls;
    }
  },
};

