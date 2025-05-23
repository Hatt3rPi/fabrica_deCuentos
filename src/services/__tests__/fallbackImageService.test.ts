import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackImageService } from '../fallbackImageService';
import { VisualStyle } from '../../constants/visualStyles';

// Mock de Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockImplementation((path) => ({
          data: { publicUrl: `https://example.com/storage/fallback-images/${path}` },
          error: null,
        })),
        list: vi.fn().mockReturnValue({
          data: [
            { name: 'acuarela-digital.webp' },
            { name: 'dibujado-a-mano.webp' },
            { name: 'recortes-de-papel.webp' },
            { name: 'kawaii.webp' },
          ],
          error: null,
        }),
      }),
    },
  },
}));

describe('FallbackImageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPublicUrl', () => {
    it('debería obtener la URL pública para un estilo específico', async () => {
      const url = await FallbackImageService.getPublicUrl(VisualStyle.ACUARELA_DIGITAL);
      expect(url).toBe('https://example.com/storage/fallback-images/acuarela-digital.webp');
    });

    it('debería manejar errores y retornar la URL local como respaldo', async () => {
      // Sobrescribir el mock para simular un error
      const mockFrom = vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({
          data: null,
          error: new Error('Error de prueba'),
        }),
      });

      const originalFrom = vi.mocked(require('../../lib/supabase').supabase.storage.from);
      vi.mocked(require('../../lib/supabase').supabase.storage.from).mockImplementation(mockFrom);

      const url = await FallbackImageService.getPublicUrl(VisualStyle.ACUARELA_DIGITAL);
      expect(url).toBe('/supabase/storage/fallback-images/acuarela-digital.webp');

      // Restaurar el mock original
      vi.mocked(require('../../lib/supabase').supabase.storage.from).mockImplementation(originalFrom);
    });
  });

  describe('checkAvailability', () => {
    it('debería verificar la disponibilidad de todas las imágenes', async () => {
      const availability = await FallbackImageService.checkAvailability();
      
      expect(availability).toEqual({
        [VisualStyle.ACUARELA_DIGITAL]: true,
        [VisualStyle.DIBUJADO_A_MANO]: true,
        [VisualStyle.RECORTES_DE_PAPEL]: true,
        [VisualStyle.KAWAII]: true,
      });
    });

    it('debería manejar errores y retornar todas las imágenes como no disponibles', async () => {
      // Sobrescribir el mock para simular un error
      const mockFrom = vi.fn().mockReturnValue({
        list: vi.fn().mockReturnValue({
          data: null,
          error: new Error('Error de prueba'),
        }),
      });

      const originalFrom = vi.mocked(require('../../lib/supabase').supabase.storage.from);
      vi.mocked(require('../../lib/supabase').supabase.storage.from).mockImplementation(mockFrom);

      const availability = await FallbackImageService.checkAvailability();
      
      expect(availability).toEqual({
        [VisualStyle.ACUARELA_DIGITAL]: false,
        [VisualStyle.DIBUJADO_A_MANO]: false,
        [VisualStyle.RECORTES_DE_PAPEL]: false,
        [VisualStyle.KAWAII]: false,
      });

      // Restaurar el mock original
      vi.mocked(require('../../lib/supabase').supabase.storage.from).mockImplementation(originalFrom);
    });
  });

  describe('getAllPublicUrls', () => {
    it('debería obtener todas las URLs públicas', async () => {
      const urls = await FallbackImageService.getAllPublicUrls();
      
      expect(urls).toEqual({
        [VisualStyle.ACUARELA_DIGITAL]: 'https://example.com/storage/fallback-images/acuarela-digital.webp',
        [VisualStyle.DIBUJADO_A_MANO]: 'https://example.com/storage/fallback-images/dibujado-a-mano.webp',
        [VisualStyle.RECORTES_DE_PAPEL]: 'https://example.com/storage/fallback-images/recortes-de-papel.webp',
        [VisualStyle.KAWAII]: 'https://example.com/storage/fallback-images/kawaii.webp',
      });
    });
  });
});

