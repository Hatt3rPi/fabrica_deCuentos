/**
 * Componente PublicImage
 * 
 * Componente optimizado para imágenes públicas que no requieren protección.
 * Usado para portadas, miniaturas, y otros contenidos no sensibles.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Loader, ImageOff } from 'lucide-react';

interface PublicImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  showErrorIcon?: boolean;
}

const PublicImage: React.FC<PublicImageProps> = ({
  src,
  alt,
  className = '',
  style,
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  placeholder,
  showErrorIcon = true,
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  // Actualizar currentSrc cuando cambia src
  useEffect(() => {
    if (src && src !== currentSrc) {
      setCurrentSrc(src);
      setImageState('loading');
    }
  }, [src]);

  // Si no hay src, mostrar error directamente
  if (!src && !fallbackSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height, ...style }}
      >
        {showErrorIcon && (
          <ImageOff className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        )}
      </div>
    );
  }

  const handleLoad = useCallback(() => {
    setImageState('loaded');
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    setImageState('error');
    onError?.();
  }, [currentSrc, fallbackSrc, onError]);

  // Mostrar placeholder mientras carga
  if (imageState === 'loading' && placeholder) {
    return (
      <>
        <div className={className} style={style}>
          {placeholder}
        </div>
        <img
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: 'none' }}
        />
      </>
    );
  }

  // Mostrar error
  if (imageState === 'error') {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height, ...style }}
      >
        {showErrorIcon && (
          <ImageOff className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default PublicImage;