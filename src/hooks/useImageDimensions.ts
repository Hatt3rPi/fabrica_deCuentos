import { useState, useEffect } from 'react';

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  loaded: boolean;
}

export const useImageDimensions = (imageUrl: string | undefined): ImageDimensions => {
  const [dimensions, setDimensions] = useState<ImageDimensions>({
    width: 0,
    height: 0,
    aspectRatio: 1,
    loaded: false
  });

  useEffect(() => {
    if (!imageUrl) {
      setDimensions({
        width: 0,
        height: 0,
        aspectRatio: 1,
        loaded: false
      });
      return;
    }

    const img = new Image();
    
    const handleLoad = () => {
      // Explicit division by zero protection for clarity
      const aspectRatio = img.naturalHeight > 0 
        ? img.naturalWidth / img.naturalHeight 
        : 1; // Default to square aspect ratio if height is 0
      
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio,
        loaded: true
      });
    };

    const handleError = () => {
      setDimensions({
        width: 0,
        height: 0,
        aspectRatio: 1,
        loaded: false
      });
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = imageUrl;

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [imageUrl]);

  return dimensions;
};