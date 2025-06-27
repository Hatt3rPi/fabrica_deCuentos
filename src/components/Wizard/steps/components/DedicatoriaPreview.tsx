import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useDedicatoriaConfig } from '../../../../hooks/useDedicatoriaConfig';

type LayoutOption = 'imagen-arriba' | 'imagen-abajo' | 'imagen-izquierda' | 'imagen-derecha';
type AlignmentOption = 'centro' | 'izquierda' | 'derecha';
type ImageSizeOption = 'pequena' | 'mediana' | 'grande';

interface DedicatoriaPreviewProps {
  text: string;
  imageUrl?: string;
  layout: LayoutOption;
  alignment: AlignmentOption;
  imageSize: ImageSizeOption;
}

const DedicatoriaPreview: React.FC<DedicatoriaPreviewProps> = ({
  text,
  imageUrl,
  layout,
  alignment,
  imageSize
}) => {
  const { backgroundImageUrl } = useDedicatoriaConfig();
  const getImageSizeClass = () => {
    switch (imageSize) {
      case 'pequena': return 'w-16 h-16';
      case 'mediana': return 'w-24 h-24';
      case 'grande': return 'w-32 h-32';
      default: return 'w-24 h-24';
    }
  };

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'izquierda': return 'text-left';
      case 'derecha': return 'text-right';
      case 'centro': return 'text-center';
      default: return 'text-center';
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'imagen-arriba':
        return 'flex flex-col items-center gap-4';
      case 'imagen-abajo':
        return 'flex flex-col-reverse items-center gap-4';
      case 'imagen-izquierda':
        return 'flex flex-row items-center gap-4';
      case 'imagen-derecha':
        return 'flex flex-row-reverse items-center gap-4';
      default:
        return 'flex flex-col items-center gap-4';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Vista Previa
      </h3>
      
      <div 
        className="rounded-lg p-8 min-h-[400px] flex items-center justify-center bg-cover bg-center relative"
        style={{
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
          backgroundColor: backgroundImageUrl ? undefined : '#f9fafb'
        }}
      >
        {/* Overlay para mejorar legibilidad del texto */}
        {backgroundImageUrl && (
          <div className="absolute inset-0 bg-black/20 rounded-lg" />
        )}
        
        <div className="relative z-10 w-full">
        {text ? (
          <div className={`${getLayoutClasses()} max-w-sm`}>
            {imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className={`${getImageSizeClass()} object-cover rounded-lg`}
                />
              </div>
            )}
            <div className={`${getAlignmentClass()} flex-1`}>
              <p className="text-gray-800 dark:text-gray-200 italic text-lg leading-relaxed">
                {text}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <ImageIcon className="mx-auto h-12 w-12 mb-4" />
            <p>Escribe tu dedicatoria para ver la vista previa</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default DedicatoriaPreview;