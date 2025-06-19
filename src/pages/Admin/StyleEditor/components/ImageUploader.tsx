import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageChange: (url: string) => void;
  label: string;
  pageType: 'cover' | 'page';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  currentImage, 
  onImageChange, 
  label,
  pageType 
}) => {
  const { supabase } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `style_design/${pageType}_${timestamp}.${fileExt}`;

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('storage')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('storage')
        .getPublicUrl(fileName);

      if (publicUrlData.publicUrl) {
        onImageChange(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Error al subir la imagen. Por favor intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <ImageIcon className="w-4 h-4 inline mr-1" />
        {label}
      </label>
      
      {currentImage ? (
        <div className="relative">
          <img 
            src={currentImage} 
            alt="Imagen de fondo"
            className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
        >
          {isUploading ? (
            <>
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8" />
              <span className="text-sm">Click para subir imagen</span>
              <span className="text-xs">JPG, PNG (máx. 5MB)</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Esta imagen se usará como fondo predeterminado para la {pageType === 'cover' ? 'portada' : 'página interior'} en el editor.
      </p>
    </div>
  );
};

export default ImageUploader;