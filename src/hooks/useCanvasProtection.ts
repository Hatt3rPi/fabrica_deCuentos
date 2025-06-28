/**
 * Hook useCanvasProtection
 * 
 * Maneja la renderización de imágenes en canvas para protección adicional
 * contra screenshots y herramientas de extracción de imágenes.
 */

import { useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

interface CanvasProtectionOptions {
  enableNoise?: boolean;
  noiseIntensity?: number;
  enableFingerprinting?: boolean;
  hideOriginal?: boolean;
}

interface UseCanvasProtectionResult {
  renderToCanvas: (
    imageElement: HTMLImageElement,
    canvasElement: HTMLCanvasElement,
    options?: CanvasProtectionOptions
  ) => Promise<boolean>;
  createProtectedCanvas: (
    imageElement: HTMLImageElement,
    options?: CanvasProtectionOptions
  ) => Promise<HTMLCanvasElement | null>;
  addImageNoise: (
    imageData: ImageData,
    intensity?: number
  ) => ImageData;
  addInvisibleWatermark: (
    canvas: HTMLCanvasElement,
    text: string
  ) => void;
}

const useCanvasProtection = (): UseCanvasProtectionResult => {
  const protectionActive = useRef(false);

  /**
   * Renderiza una imagen en canvas con protecciones aplicadas
   */
  const renderToCanvas = useCallback(async (
    imageElement: HTMLImageElement,
    canvasElement: HTMLCanvasElement,
    options: CanvasProtectionOptions = {}
  ): Promise<boolean> => {
    try {
      const {
        enableNoise = true,
        noiseIntensity = 2,
        enableFingerprinting = true,
        hideOriginal = true
      } = options;

      const ctx = canvasElement.getContext('2d');
      if (!ctx) {
        logger.warn('No se pudo obtener contexto 2D del canvas');
        return false;
      }

      // Configurar canvas con las mismas dimensiones que la imagen
      const { naturalWidth, naturalHeight, width, height } = imageElement;
      canvasElement.width = naturalWidth || width;
      canvasElement.height = naturalHeight || height;

      // Dibujar imagen original en canvas
      ctx.drawImage(imageElement, 0, 0);

      // Aplicar protecciones
      if (enableNoise) {
        applyImageNoise(ctx, canvasElement, noiseIntensity);
      }

      if (enableFingerprinting) {
        addDeviceFingerprint(ctx, canvasElement);
      }

      // Añadir watermark invisible
      addInvisibleWatermark(canvasElement, 'La CuenterIA Protected');

      // Configurar estilos del canvas
      canvasElement.style.maxWidth = '100%';
      canvasElement.style.height = 'auto';
      canvasElement.style.userSelect = 'none';
      canvasElement.style.WebkitUserSelect = 'none';
      canvasElement.style.WebkitUserDrag = 'none';

      // Ocultar imagen original si se solicita
      if (hideOriginal) {
        imageElement.style.display = 'none';
        canvasElement.style.display = 'block';
      }

      protectionActive.current = true;
      logger.debug('Canvas protection applied successfully');
      return true;

    } catch (error) {
      logger.error('Error applying canvas protection:', error);
      return false;
    }
  }, []);

  /**
   * Crea un nuevo canvas protegido a partir de una imagen
   */
  const createProtectedCanvas = useCallback(async (
    imageElement: HTMLImageElement,
    options: CanvasProtectionOptions = {}
  ): Promise<HTMLCanvasElement | null> => {
    try {
      const canvas = document.createElement('canvas');
      canvas.className = 'protected-canvas';
      
      const success = await renderToCanvas(imageElement, canvas, options);
      
      if (success) {
        return canvas;
      }
      
      return null;
    } catch (error) {
      logger.error('Error creating protected canvas:', error);
      return null;
    }
  }, [renderToCanvas]);

  /**
   * Aplica ruido a la imagen para dificultar la extracción
   */
  const applyImageNoise = useCallback((
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    intensity: number = 2
  ) => {
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const noisyImageData = addImageNoise(imageData, intensity);
      ctx.putImageData(noisyImageData, 0, 0);
    } catch (error) {
      logger.debug('Error applying image noise:', error);
    }
  }, []);

  /**
   * Añade ruido imperceptible a los datos de la imagen
   */
  const addImageNoise = useCallback((
    imageData: ImageData,
    intensity: number = 2
  ): ImageData => {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Modificar ligeramente los valores RGB (imperceptible al ojo humano)
      const noise = (Math.random() - 0.5) * intensity;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
      // data[i + 3] es alpha, lo dejamos sin cambios
    }
    
    return imageData;
  }, []);

  /**
   * Añade fingerprint del dispositivo para rastreo
   */
  const addDeviceFingerprint = useCallback((
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    try {
      // Crear fingerprint único basado en características del dispositivo
      const fingerprint = generateDeviceFingerprint();
      
      // Codificar fingerprint en píxeles específicos (steganografía)
      const fingerprintData = new TextEncoder().encode(fingerprint);
      
      // Embeber datos en los bits menos significativos de píxeles específicos
      const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
      const data = imageData.data;
      
      for (let i = 0; i < fingerprintData.length && i * 4 < data.length; i++) {
        const byte = fingerprintData[i];
        const pixelIndex = i * 4;
        
        // Embeber en el bit menos significativo del canal rojo
        data[pixelIndex] = (data[pixelIndex] & 0xFE) | (byte & 0x01);
      }
      
      ctx.putImageData(imageData, 0, 0);
      logger.debug('Device fingerprint embedded');
    } catch (error) {
      logger.debug('Error adding device fingerprint:', error);
    }
  }, []);

  /**
   * Genera fingerprint único del dispositivo
   */
  const generateDeviceFingerprint = useCallback((): string => {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      window.devicePixelRatio?.toString() || '1',
    ];
    
    // Crear hash simple del fingerprint
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }, []);

  /**
   * Añade watermark invisible usando técnicas de steganografía
   */
  const addInvisibleWatermark = useCallback((
    canvas: HTMLCanvasElement,
    text: string
  ) => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Crear timestamp único
      const timestamp = Date.now().toString();
      const watermarkText = `${text}|${timestamp}`;
      
      // Convertir texto a bytes
      const textBytes = new TextEncoder().encode(watermarkText);
      
      // Obtener datos de imagen para modificar
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Embeber watermark en píxeles distribuidos
      const stepSize = Math.floor(data.length / (textBytes.length * 4 * 8)); // 8 bits por byte
      
      for (let i = 0; i < textBytes.length; i++) {
        const byte = textBytes[i];
        
        for (let bit = 0; bit < 8; bit++) {
          const bitValue = (byte >> bit) & 1;
          const pixelIndex = (i * 8 + bit) * stepSize;
          
          if (pixelIndex < data.length) {
            // Modificar el bit menos significativo del canal azul
            data[pixelIndex + 2] = (data[pixelIndex + 2] & 0xFE) | bitValue;
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      logger.debug('Invisible watermark embedded:', watermarkText);
    } catch (error) {
      logger.debug('Error adding invisible watermark:', error);
    }
  }, []);

  return {
    renderToCanvas,
    createProtectedCanvas,
    addImageNoise,
    addInvisibleWatermark,
  };
};

export default useCanvasProtection;