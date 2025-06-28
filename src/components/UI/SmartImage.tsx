/**
 * Componente SmartImage
 * 
 * Decide automáticamente si usar PublicImage o ProtectedImage
 * basándose en el tipo de contenido y contexto.
 */

import React from 'react';
import PublicImage from './PublicImage';
import ProtectedImage from './ProtectedImage';
import { detectImageType, needsProtection } from '../../utils/imageProtectionUtils';
import type { ImageType } from '../../utils/imageProtectionUtils';

interface SmartImageProps {
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
  
  // Props para determinar el tipo de imagen
  imageType?: ImageType;
  pageNumber?: number;
  isStoryPage?: boolean;
  
  // Props específicos de ProtectedImage
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  withWatermark?: boolean;
  disableRightClick?: boolean;
  disableDragDrop?: boolean;
  disableDevTools?: boolean;
  canvasProtection?: boolean;
  
  // Props específicos de PublicImage
  showErrorIcon?: boolean;
}

const SmartImage: React.FC<SmartImageProps> = ({
  src,
  imageType,
  pageNumber,
  isStoryPage,
  ...props
}) => {
  // Determinar si la imagen necesita protección
  const detectedType = imageType || detectImageType(src, { pageNumber, isStoryPage });
  const isProtected = needsProtection(detectedType);
  
  // Usar el componente apropiado
  if (isProtected) {
    return (
      <ProtectedImage
        src={src}
        {...props}
        withWatermark={props.withWatermark ?? true}
        disableRightClick={props.disableRightClick ?? true}
        disableDragDrop={props.disableDragDrop ?? true}
      />
    );
  }
  
  return (
    <PublicImage
      src={src}
      {...props}
      showErrorIcon={props.showErrorIcon ?? true}
    />
  );
};

export default SmartImage;