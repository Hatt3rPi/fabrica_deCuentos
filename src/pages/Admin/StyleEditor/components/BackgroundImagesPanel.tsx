import React from 'react';
import { Image, Plus, Info } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { ComponentConfig, ImageComponentConfig } from '../../../../types/styleConfig';

interface BackgroundImagesPanelProps {
  // Imágenes de fondo actuales
  customCoverImage: string | null;
  customPageImage: string | null;
  customDedicatoriaImage: string | null;
  onCoverImageChange: (url: string) => void;
  onPageImageChange: (url: string) => void;
  onDedicatoriaImageChange: (url: string) => void;
  
  // Para crear componentes de imagen de fondo
  currentPageType: 'cover' | 'page' | 'dedicatoria';
  onAddComponent: (component: Omit<ComponentConfig, 'id'>) => void;
}

const BackgroundImagesPanel: React.FC<BackgroundImagesPanelProps> = ({
  customCoverImage,
  customPageImage,
  customDedicatoriaImage,
  onCoverImageChange,
  onPageImageChange,
  onDedicatoriaImageChange,
  currentPageType,
  onAddComponent
}) => {
  
  const handleCreateBackgroundComponent = (pageType: 'cover' | 'page' | 'dedicatoria') => {
    const imageUrl = 
      pageType === 'cover' ? customCoverImage :
      pageType === 'page' ? customPageImage :
      customDedicatoriaImage;
    
    if (!imageUrl) return;
    
    const newComponent: Omit<ImageComponentConfig, 'id'> = {
      type: 'image',
      name: `Fondo ${pageType === 'cover' ? 'Portada' : pageType === 'page' ? 'Interior' : 'Dedicatoria'}`,
      url: imageUrl,
      x: 0,
      y: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      size: 'custom',
      position: 'center',
      horizontalPosition: 'center',
      style: {
        opacity: 0.3, // Opacidad baja para que sea fondo
        borderRadius: '0px',
        zIndex: -1 // Enviar al fondo
      },
      pageType,
      isBackground: true, // Marcar como fondo para distinguirlo
      locked: false
    };
    
    onAddComponent(newComponent);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Imágenes de Referencia
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Estas imágenes sirven como referencia visual. Para usarlas como fondo de página, 
              súbelas aquí y luego usa el botón "Crear Componente de Fondo".
            </p>
          </div>
        </div>
      </div>

      {/* Imagen de Portada */}
      <div className="space-y-3">
        <ImageUploader
          currentImage={customCoverImage}
          onImageChange={onCoverImageChange}
          label="Imagen de fondo para Portada"
          pageType="cover"
        />
        {customCoverImage && (
          <button
            onClick={() => handleCreateBackgroundComponent('cover')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Componente de Fondo (Portada)
          </button>
        )}
      </div>

      {/* Imagen de Páginas Interiores */}
      <div className="space-y-3">
        <ImageUploader
          currentImage={customPageImage}
          onImageChange={onPageImageChange}
          label="Imagen de fondo para Páginas Interiores"
          pageType="page"
        />
        {customPageImage && (
          <button
            onClick={() => handleCreateBackgroundComponent('page')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Componente de Fondo (Interior)
          </button>
        )}
      </div>

      {/* Imagen de Dedicatoria */}
      <div className="space-y-3">
        <ImageUploader
          currentImage={customDedicatoriaImage}
          onImageChange={onDedicatoriaImageChange}
          label="Imagen de fondo para Dedicatoria"
          pageType="dedicatoria"
        />
        {customDedicatoriaImage && (
          <button
            onClick={() => handleCreateBackgroundComponent('dedicatoria')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Componente de Fondo (Dedicatoria)
          </button>
        )}
      </div>
    </div>
  );
};

export default BackgroundImagesPanel;