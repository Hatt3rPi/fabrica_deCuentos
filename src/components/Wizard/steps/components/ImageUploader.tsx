import React, { useRef } from 'react';
import { Upload, X, Lock } from 'lucide-react';

interface ImageUploaderProps {
  imageUrl?: string;
  isUploading: boolean;
  isDisabled: boolean;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  isUploading,
  isDisabled,
  onImageUpload,
  onRemoveImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Imagen Personal (Opcional)
      </h3>
      
      {!imageUrl ? (
        <div
          onClick={handleClick}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${isDisabled
                      ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-700/50'
                      : 'border-gray-300 dark:border-gray-600 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500'
                    }`}
        >
          {isUploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {isDisabled ? (
                <Lock className="mx-auto h-8 w-8 text-gray-400" />
              ) : (
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
              )}
              <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {isDisabled ? 'Carga de imagen bloqueada' : 'Haz clic para subir una imagen'}
              </p>
              {!isDisabled && (
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP hasta 5MB
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Imagen de dedicatoria"
            className="w-full h-48 object-cover rounded-lg"
          />
          {!isDisabled && (
            <button
              onClick={onRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 
                        hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isDisabled && (
            <div className="absolute top-2 right-2 bg-gray-500 text-white rounded-full p-1">
              <Lock className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        disabled={isDisabled}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;