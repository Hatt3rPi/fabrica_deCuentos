/**
 * Hook useProtectedImage
 * 
 * Maneja la lógica de carga y protección de imágenes de forma reutilizable
 */

import { useState, useEffect, useCallback } from 'react';
import { useImageProtection } from '../services/imageProtectionService';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';

interface UseProtectedImageOptions {
  withWatermark?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  autoLoad?: boolean;
  cacheKey?: string;
}

interface UseProtectedImageResult {
  protectedUrl: string | null;
  isLoading: boolean;
  error: string | null;
  loadImage: () => Promise<void>;
  refreshImage: () => Promise<void>;
  cached: boolean;
}

const useProtectedImage = (
  originalSrc: string | null,
  options: UseProtectedImageOptions = {}
): UseProtectedImageResult => {
  const {
    withWatermark = true,
    width,
    height,
    quality = 85,
    format = 'webp',
    autoLoad = true,
    cacheKey,
  } = options;

  const { user } = useAuth();
  const { getProtectedUrl } = useImageProtection();

  const [state, setState] = useState({
    protectedUrl: null as string | null,
    isLoading: false,
    error: null as string | null,
    cached: false,
  });

  /**
   * Extrae el path relativo de una URL de Supabase
   */
  const extractFilePath = useCallback((src: string): string => {
    if (src.includes('/storage/v1/object/')) {
      const urlParts = src.split('/storage/v1/object/');
      if (urlParts.length > 1) {
        // Remover 'public/' o 'sign/' del inicio
        return urlParts[1].replace(/^(public|sign)\/[^/]+\//, '');
      }
    }
    return src;
  }, []);

  /**
   * Carga la imagen protegida
   */
  const loadImage = useCallback(async (): Promise<void> => {
    if (!originalSrc || !user) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'No hay imagen o usuario disponible',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const filePath = extractFilePath(originalSrc);
      
      const result = await getProtectedUrl(filePath, {
        withWatermark,
        width,
        quality,
      });

      setState(prev => ({
        ...prev,
        protectedUrl: result.url,
        isLoading: false,
        cached: result.cached,
      }));

      logger.debug('Protected image loaded:', {
        originalSrc,
        filePath,
        cached: result.cached,
        cacheKey,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      logger.error('Error loading protected image:', {
        originalSrc,
        error: errorMessage,
        cacheKey,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [originalSrc, user, extractFilePath, getProtectedUrl, withWatermark, width, quality, cacheKey]);

  /**
   * Refresca la imagen (ignora cache)
   */
  const refreshImage = useCallback(async (): Promise<void> => {
    // Limpiar estado actual
    setState(prev => ({
      ...prev,
      protectedUrl: null,
      cached: false,
    }));

    // Recargar
    await loadImage();
  }, [loadImage]);

  // Auto-cargar imagen cuando cambian las dependencias
  useEffect(() => {
    if (autoLoad) {
      loadImage();
    }
  }, [loadImage, autoLoad]);

  // Limpiar estado cuando cambia la imagen original
  useEffect(() => {
    setState(prev => ({
      ...prev,
      protectedUrl: null,
      error: null,
      cached: false,
    }));
  }, [originalSrc]);

  return {
    protectedUrl: state.protectedUrl,
    isLoading: state.isLoading,
    error: state.error,
    loadImage,
    refreshImage,
    cached: state.cached,
  };
};

export default useProtectedImage;