import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FallbackImagesViewer from '../FallbackImagesViewer';
import { FallbackImageService } from '../../../services/fallbackImageService';
import { VisualStyle } from '../../../constants/visualStyles';

// Mock del servicio de imágenes de respaldo
vi.mock('../../../services/fallbackImageService', () => ({
  FallbackImageService: {
    checkAvailability: vi.fn(),
    getAllPublicUrls: vi.fn(),
  },
}));

describe('FallbackImagesViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería mostrar un mensaje de carga inicialmente', () => {
    // Configurar los mocks para que no resuelvan inmediatamente
    vi.mocked(FallbackImageService.checkAvailability).mockReturnValue(
      new Promise(() => {})
    );
    vi.mocked(FallbackImageService.getAllPublicUrls).mockReturnValue(
      new Promise(() => {})
    );

    render(<FallbackImagesViewer />);
    
    expect(screen.getByText('Cargando imágenes de respaldo...')).toBeInTheDocument();
  });

  it('debería mostrar las imágenes disponibles', async () => {
    // Configurar los mocks para simular imágenes disponibles
    vi.mocked(FallbackImageService.checkAvailability).mockResolvedValue({
      [VisualStyle.ACUARELA_DIGITAL]: true,
      [VisualStyle.DIBUJADO_A_MANO]: true,
      [VisualStyle.RECORTES_DE_PAPEL]: false,
      [VisualStyle.KAWAII]: true,
    });
    
    vi.mocked(FallbackImageService.getAllPublicUrls).mockResolvedValue({
      [VisualStyle.ACUARELA_DIGITAL]: 'https://example.com/acuarela-digital.webp',
      [VisualStyle.DIBUJADO_A_MANO]: 'https://example.com/dibujado-a-mano.webp',
      [VisualStyle.RECORTES_DE_PAPEL]: 'https://example.com/recortes-de-papel.webp',
      [VisualStyle.KAWAII]: 'https://example.com/kawaii.webp',
    });

    render(<FallbackImagesViewer />);
    
    // Esperar a que se carguen las imágenes
    await waitFor(() => {
      expect(screen.getByText('Imágenes de Respaldo por Estilo')).toBeInTheDocument();
    });
    
    // Verificar que se muestren las imágenes disponibles
    expect(screen.getAllByText('Disponible')).toHaveLength(3);
    
    // Verificar que se muestre un mensaje para la imagen no disponible
    expect(screen.getByText('Imagen no disponible')).toBeInTheDocument();
  });

  it('debería mostrar un mensaje de error si falla la carga', async () => {
    // Configurar los mocks para simular un error
    vi.mocked(FallbackImageService.checkAvailability).mockRejectedValue(
      new Error('Error de prueba')
    );

    render(<FallbackImagesViewer />);
    
    // Esperar a que se muestre el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Error al cargar las imágenes de respaldo')).toBeInTheDocument();
    });
  });
});

