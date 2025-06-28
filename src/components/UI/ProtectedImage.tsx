/**
 * Componente ProtectedImage
 * 
 * Reemplaza las etiquetas <img> normales con un sistema de protección
 * multi-capa que incluye URLs firmadas, watermarks y protecciones de UI.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useImageProtection } from '../../services/imageProtectionService';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  withWatermark?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  disableRightClick?: boolean;
  disableDragDrop?: boolean;
  disableDevTools?: boolean;
  canvasProtection?: boolean;
}

interface ProtectedImageState {
  protectedUrl: string | null;
  isLoading: boolean;
  error: string | null;
  devToolsDetected: boolean;
}

const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  alt,
  className = '',
  style,
  width,
  height,
  quality = 85,
  format: _format = 'webp',
  withWatermark = true,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  placeholder,
  disableRightClick = true,
  disableDragDrop = true,
  disableDevTools = true,
  canvasProtection = false,
}) => {
  const { user } = useAuth();
  const { getProtectedUrl, applyProtections, detectDevTools } = useImageProtection();
  
  const [state, setState] = useState<ProtectedImageState>({
    protectedUrl: null,
    isLoading: true,
    error: null,
    devToolsDetected: false,
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const devToolsCheckRef = useRef<NodeJS.Timeout>();

  /**
   * Detecta si las herramientas de desarrollo están abiertas
   */
  const checkDevTools = useCallback(() => {
    if (!disableDevTools) return;

    try {
      const detected = detectDevTools();
      if (detected !== state.devToolsDetected) {
        setState(prev => ({ ...prev, devToolsDetected: detected }));
        
        if (detected) {
          logger.warn('Herramientas de desarrollo detectadas');
          // Opcional: ocultar imagen o mostrar mensaje
        }
      }
    } catch (error) {
      logger.debug('Error detecting dev tools:', error);
    }
  }, [detectDevTools, disableDevTools, state.devToolsDetected]);

  /**
   * Carga la URL protegida para la imagen
   */
  const loadProtectedImage = useCallback(async () => {
    if (!src || !user) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'No hay imagen o usuario para cargar' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Extraer el path relativo de la URL completa si es necesario
      let filePath = src;
      if (src.includes('/storage/v1/object/')) {
        const urlParts = src.split('/storage/v1/object/');
        if (urlParts.length > 1) {
          // Remover 'public/' o 'sign/' del inicio
          filePath = urlParts[1].replace(/^(public|sign)\/[^/]+\//, '');
        }
      }

      const result = await getProtectedUrl(filePath, {
        withWatermark,
        width,
        quality,
      });

      setState(prev => ({
        ...prev,
        protectedUrl: result.url,
        isLoading: false,
      }));

    } catch (error) {
      logger.error('Error loading protected image:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [src, user, getProtectedUrl, withWatermark, width, quality]);

  /**
   * Aplica protecciones de UI al elemento imagen
   */
  const applyImageProtections = useCallback(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    // Aplicar protecciones básicas
    if (disableRightClick || disableDragDrop) {
      applyProtections(imageElement, {
        rightClickDisabled: disableRightClick,
        watermarkEnabled: withWatermark,
        watermarkOpacity: 0.15,
        watermarkPosition: 'bottom-right',
        signedUrlDuration: 300,
        rateLimitPerMinute: 60,
        canvasProtectionEnabled: canvasProtection,
        devToolsDetection: disableDevTools,
      });
    }

    // Protecciones adicionales específicas de imagen
    if (disableDragDrop) {
      imageElement.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      });
    }

    // Prevenir guardar imagen
    imageElement.addEventListener('keydown', (e) => {
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    });

  }, [disableRightClick, disableDragDrop, withWatermark, canvasProtection, disableDevTools, applyProtections]);

  /**
   * Renderiza la imagen en canvas para protección adicional
   */
  const renderToCanvas = useCallback(async () => {
    if (!canvasProtection || !imageRef.current || !canvasRef.current) return;

    try {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Configurar canvas con las mismas dimensiones que la imagen
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Dibujar imagen en canvas
      ctx.drawImage(img, 0, 0);

      // Aplicar técnicas anti-screenshot
      if (disableDevTools) {
        // Añadir ruido invisible
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // Modificar ligeramente los valores RGB (imperceptible al ojo humano)
          data[i] = Math.min(255, data[i] + Math.random() * 2 - 1);
          data[i + 1] = Math.min(255, data[i + 1] + Math.random() * 2 - 1);
          data[i + 2] = Math.min(255, data[i + 2] + Math.random() * 2 - 1);
        }
        
        ctx.putImageData(imageData, 0, 0);
      }

      // Ocultar imagen original y mostrar canvas
      img.style.display = 'none';
      canvas.style.display = 'block';

    } catch (error) {
      logger.debug('Error rendering to canvas:', error);
    }
  }, [canvasProtection, disableDevTools]);

  /**
   * Maneja la carga exitosa de la imagen
   */
  const handleImageLoad = useCallback(() => {
    applyImageProtections();
    
    if (canvasProtection) {
      renderToCanvas();
    }

    onLoad?.();
  }, [applyImageProtections, canvasProtection, renderToCanvas, onLoad]);

  /**
   * Maneja errores de carga de imagen
   */
  const handleImageError = useCallback(() => {
    logger.warn('Error loading protected image, trying fallback');
    
    if (fallbackSrc && state.protectedUrl !== fallbackSrc) {
      setState(prev => ({ ...prev, protectedUrl: fallbackSrc }));
      return;
    }

    setState(prev => ({
      ...prev,
      error: 'Error cargando imagen',
    }));

    onError?.();
  }, [fallbackSrc, state.protectedUrl, onError]);

  // Cargar imagen protegida al montar el componente
  useEffect(() => {
    loadProtectedImage();
  }, [loadProtectedImage]);

  // Configurar detección de herramientas de desarrollo
  useEffect(() => {
    if (disableDevTools) {
      devToolsCheckRef.current = setInterval(checkDevTools, 1000);
      
      return () => {
        if (devToolsCheckRef.current) {
          clearInterval(devToolsCheckRef.current);
        }
      };
    }
  }, [disableDevTools, checkDevTools]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (devToolsCheckRef.current) {
        clearInterval(devToolsCheckRef.current);
      }
    };
  }, []);

  // Mostrar placeholder mientras carga
  if (state.isLoading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        {placeholder || (
          <div className="text-gray-400 text-sm">
            Cargando imagen protegida...
          </div>
        )}
      </div>
    );
  }

  // Mostrar error si hay problemas
  if (state.error || !state.protectedUrl) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-gray-500 text-sm text-center p-4">
          {state.error || 'No se pudo cargar la imagen'}
        </div>
      </div>
    );
  }

  // Ocultar imagen si se detectan herramientas de desarrollo
  if (state.devToolsDetected && disableDevTools) {
    return (
      <div 
        className={`bg-black flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-white text-sm text-center p-4">
          🔒 Contenido protegido
        </div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    ...style,
  };

  const imageStyle: React.CSSProperties = {
    maxWidth: '100%',
    height: 'auto',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitUserDrag: 'none',
    WebkitTouchCallout: 'none',
  };

  return (
    <div style={containerStyle} className={`protected-image-container ${className}`}>
      {/* Imagen principal */}
      <img
        ref={imageRef}
        src={state.protectedUrl}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        style={imageStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
        draggable={false}
        className="protected-image"
      />

      {/* Canvas para protección adicional */}
      {canvasProtection && (
        <canvas
          ref={canvasRef}
          style={{
            ...imageStyle,
            display: 'none',
          }}
          className="protected-canvas"
        />
      )}

      {/* Overlay de protección */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          pointerEvents: disableRightClick ? 'auto' : 'none',
          background: 'transparent',
        }}
        onContextMenu={(e) => {
          if (disableRightClick) {
            e.preventDefault();
            return false;
          }
        }}
        onDragStart={(e) => {
          if (disableDragDrop) {
            e.preventDefault();
            return false;
          }
        }}
      />
    </div>
  );
};

export default ProtectedImage;