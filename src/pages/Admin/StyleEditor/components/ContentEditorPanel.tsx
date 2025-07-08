import React, { useState } from 'react';
import { Type, Image, Upload, Save } from 'lucide-react';
import { ComponentConfig, TextComponentConfig, ImageComponentConfig } from '../../../../types/styleConfig';

interface ContentEditorPanelProps {
  component: ComponentConfig;
  onUpdate: (updates: Partial<ComponentConfig>) => void;
}

const ContentEditorPanel: React.FC<ContentEditorPanelProps> = ({ component, onUpdate }) => {
  const [tempContent, setTempContent] = useState(
    component.type === 'text' ? (component as TextComponentConfig).content : ''
  );
  const [tempImageUrl, setTempImageUrl] = useState(
    component.type === 'image' ? (component as ImageComponentConfig).url || '' : ''
  );

  const handleSaveText = () => {
    if (component.type === 'text') {
      onUpdate({ content: tempContent } as Partial<TextComponentConfig>);
    }
  };

  const handleSaveImage = () => {
    if (component.type === 'image') {
      onUpdate({ url: tempImageUrl } as Partial<ImageComponentConfig>);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // En una implementación real, aquí subirías la imagen a tu storage
      // Por ahora simulamos con URL.createObjectURL
      const imageUrl = URL.createObjectURL(file);
      setTempImageUrl(imageUrl);
      onUpdate({ url: imageUrl } as Partial<ImageComponentConfig>);
    }
  };

  if (component.type === 'text') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
            Editar Contenido de Texto
          </h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contenido del texto
          </label>
          <textarea
            value={tempContent}
            onChange={(e) => setTempContent(e.target.value)}
            placeholder="Escribe el contenido del texto..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          />
        </div>

        <button
          onClick={handleSaveText}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Guardar Texto
        </button>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Puedes usar variables como [Nombre del Autor] que se reemplazarán automáticamente.
          </p>
        </div>
      </div>
    );
  }

  if (component.type === 'image') {
    const imageComponent = component as ImageComponentConfig;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
            Editar Imagen
          </h4>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo:
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              imageComponent.imageType === 'fixed'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {imageComponent.imageType === 'fixed' ? 'Imagen Fija' : 'Imagen Dinámica'}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {imageComponent.imageType === 'fixed' 
              ? 'Esta imagen se mantiene fija y es visible para todos los usuarios.'
              : 'Esta imagen será reemplazada por la imagen que suba cada usuario.'}
          </p>
        </div>

        {imageComponent.imageType === 'fixed' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imagen actual
              </label>
              {tempImageUrl ? (
                <div className="relative">
                  <img
                    src={tempImageUrl}
                    alt="Vista previa"
                    className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
              ) : (
                <div className="w-full max-w-xs h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <div className="text-center">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin imagen</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subir nueva imagen
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Seleccionar archivo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  JPG, PNG, GIF hasta 5MB
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                O pegar URL de imagen
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={tempImageUrl}
                  onChange={(e) => setTempImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSaveImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {imageComponent.imageType === 'dynamic' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Imagen de Referencia
            </h5>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Esta es una imagen de referencia que muestra dónde aparecerá la imagen del usuario. 
              En el producto final, cada usuario verá su propia imagen en esta posición.
            </p>
            
            {tempImageUrl ? (
              <div className="relative">
                <img
                  src={tempImageUrl}
                  alt="Imagen de referencia"
                  className="w-full max-w-xs h-32 object-cover rounded-lg border border-green-300 dark:border-green-600"
                />
                <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                    REFERENCIA
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xs h-32 bg-green-100 dark:bg-green-800 rounded-lg border-2 border-dashed border-green-300 dark:border-green-600 flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-600 dark:text-green-400">Imagen del usuario</p>
                </div>
              </div>
            )}

            <div className="mt-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer text-sm">
                <Upload className="w-4 h-4" />
                Subir imagen de referencia
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default ContentEditorPanel;