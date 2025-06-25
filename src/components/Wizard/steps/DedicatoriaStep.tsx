import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';

interface DedicatoriaData {
  text: string;
  imageUrl?: string;
  layout: 'imagen-arriba' | 'imagen-abajo' | 'imagen-izquierda' | 'imagen-derecha';
  alignment: 'centro' | 'izquierda' | 'derecha';
  imageSize: 'pequena' | 'mediana' | 'grande';
}

const DedicatoriaStep: React.FC = () => {
  const { storySettings, setStorySettings } = useWizard();
  const { createNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado inicial de la dedicatoria
  const [dedicatoria, setDedicatoria] = useState<DedicatoriaData>({
    text: storySettings.dedicatoria?.text || '',
    imageUrl: storySettings.dedicatoria?.imageUrl || undefined,
    layout: storySettings.dedicatoria?.layout || 'imagen-arriba',
    alignment: storySettings.dedicatoria?.alignment || 'centro',
    imageSize: storySettings.dedicatoria?.imageSize || 'mediana'
  });

  const [isUploading, setIsUploading] = useState(false);

  // Función helper para actualizar dedicatoria evitando duplicación de lógica
  const updateDedicatoria = (updates: Partial<DedicatoriaData>) => {
    const newDedicatoria = { ...dedicatoria, ...updates };
    setDedicatoria(newDedicatoria);
    
    // Usar callback para evitar stale closures
    setStorySettings(prevSettings => ({
      ...prevSettings,
      dedicatoria: newDedicatoria
    }));
  };

  // Función para manejar la carga de imagen
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Archivo no válido',
        'Por favor selecciona un archivo de imagen (PNG, JPG, WebP)',
        NotificationPriority.HIGH
      );
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Archivo muy grande',
        'La imagen no puede superar los 5MB',
        NotificationPriority.HIGH
      );
      return;
    }

    setIsUploading(true);

    try {
      // Convertir imagen a base64 para preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        updateDedicatoria({ imageUrl });

        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Imagen cargada',
          'La imagen se cargó correctamente',
          NotificationPriority.LOW
        );
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error al procesar imagen',
          'No se pudo procesar el archivo de imagen',
          NotificationPriority.HIGH
        );
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error al cargar imagen',
        error instanceof Error ? error.message : 'Error desconocido al procesar la imagen',
        NotificationPriority.HIGH
      );
      setIsUploading(false);
    }
  };

  // Función para remover imagen
  const handleRemoveImage = () => {
    updateDedicatoria({ imageUrl: undefined });
  };

  // Función para actualizar texto
  const handleTextChange = (text: string) => {
    updateDedicatoria({ text });
  };

  // Función para actualizar configuración de layout
  const handleLayoutChange = (field: keyof DedicatoriaData, value: string) => {
    updateDedicatoria({ [field]: value });
  };

  const getImageSizeClass = () => {
    switch (dedicatoria.imageSize) {
      case 'pequena': return 'w-16 h-16';
      case 'mediana': return 'w-24 h-24';
      case 'grande': return 'w-32 h-32';
      default: return 'w-24 h-24';
    }
  };

  const getAlignmentClass = () => {
    switch (dedicatoria.alignment) {
      case 'izquierda': return 'text-left';
      case 'derecha': return 'text-right';
      case 'centro': return 'text-center';
      default: return 'text-center';
    }
  };

  const getLayoutClasses = () => {
    switch (dedicatoria.layout) {
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

  const ejemplosDedicatoria = [
    "Para mi hijo Juan, con todo mi amor",
    "Dedicado a mi pequeña aventurera",
    "Para la luz de mis ojos",
    "Con amor infinito para mi tesoro",
    "Para quien llena mis días de alegría"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Dedicatoria Personal
        </h2>
        <p className="text-gray-600">
          Agrega un toque personal y emotivo a tu cuento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Configuración */}
        <div className="space-y-6">
          {/* Texto de Dedicatoria */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Mensaje de Dedicatoria
            </h3>
            
            <textarea
              value={dedicatoria.text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Escribe tu mensaje personal..."
              maxLength={300}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {dedicatoria.text.length}/300 caracteres
              </span>
            </div>

            {/* Ejemplos de dedicatoria */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ejemplos:</p>
              <div className="space-y-1">
                {ejemplosDedicatoria.map((ejemplo, index) => (
                  <button
                    key={index}
                    onClick={() => handleTextChange(ejemplo)}
                    className="block text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-left"
                  >
                    "{ejemplo}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Carga de Imagen */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Imagen Personal (Opcional)
            </h3>
            
            {!dedicatoria.imageUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 
                          text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 
                          transition-colors"
              >
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Subiendo imagen...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Haz clic para subir una imagen
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP hasta 5MB
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <img
                  src={dedicatoria.imageUrl}
                  alt="Imagen de dedicatoria"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 
                            hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Configuración de Layout */}
          {dedicatoria.imageUrl && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Configuración de Layout
              </h3>

              {/* Posición de imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posición de la imagen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'imagen-arriba', label: 'Arriba' },
                    { value: 'imagen-abajo', label: 'Abajo' },
                    { value: 'imagen-izquierda', label: 'Izquierda' },
                    { value: 'imagen-derecha', label: 'Derecha' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLayoutChange('layout', option.value)}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        dedicatoria.layout === option.value
                          ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamaño de imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamaño de imagen
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'pequena', label: 'Pequeña' },
                    { value: 'mediana', label: 'Mediana' },
                    { value: 'grande', label: 'Grande' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLayoutChange('imageSize', option.value)}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        dedicatoria.imageSize === option.value
                          ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alineación de texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alineación del texto
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'izquierda', label: 'Izquierda', icon: AlignLeft },
                    { value: 'centro', label: 'Centro', icon: AlignCenter },
                    { value: 'derecha', label: 'Derecha', icon: AlignRight }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLayoutChange('alignment', option.value)}
                      className={`p-2 rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                        dedicatoria.alignment === option.value
                          ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      <span className="text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel de Vista Previa */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Vista Previa
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
            {dedicatoria.text ? (
              <div className={`${getLayoutClasses()} max-w-sm`}>
                {dedicatoria.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={dedicatoria.imageUrl}
                      alt="Preview"
                      className={`${getImageSizeClass()} object-cover rounded-lg`}
                    />
                  </div>
                )}
                <div className={`${getAlignmentClass()} flex-1`}>
                  <p className="text-gray-800 dark:text-gray-200 italic text-lg leading-relaxed">
                    {dedicatoria.text}
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
    </div>
  );
};

export default DedicatoriaStep;