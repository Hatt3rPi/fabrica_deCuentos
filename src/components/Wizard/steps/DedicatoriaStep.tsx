import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Lock } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { storyService } from '../../../services/storyService';
import { useStoryCompletionStatus } from '../../../hooks/useStoryCompletionStatus';

type LayoutOption = 'imagen-arriba' | 'imagen-abajo' | 'imagen-izquierda' | 'imagen-derecha';
type AlignmentOption = 'centro' | 'izquierda' | 'derecha';
type ImageSizeOption = 'pequena' | 'mediana' | 'grande';

interface DedicatoriaData {
  text: string;
  imageUrl?: string;
  layout: LayoutOption;
  alignment: AlignmentOption;
  imageSize: ImageSizeOption;
}

const DedicatoriaStep: React.FC = () => {
  const { storySettings, setStorySettings } = useWizard();
  const { createNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { storyId } = useParams();
  const { isCompleted, isLoading, error, retry } = useStoryCompletionStatus();

  // Estado inicial de la dedicatoria
  const [dedicatoria, setDedicatoria] = useState<DedicatoriaData>({
    text: storySettings.dedicatoria?.text || '',
    imageUrl: storySettings.dedicatoria?.imageUrl || undefined,
    layout: storySettings.dedicatoria?.layout || 'imagen-arriba',
    alignment: storySettings.dedicatoria?.alignment || 'centro',
    imageSize: storySettings.dedicatoria?.imageSize || 'mediana'
  });

  // DEBUG: Log para diagnosticar problema de dedicatoria
  React.useEffect(() => {
    console.log('[DedicatoriaStep] DEBUG - Estado de dedicatoria:', {
      storySettingsDedicatoria: storySettings.dedicatoria,
      localDedicatoria: dedicatoria,
      hasText: !!dedicatoria.text,
      hasImage: !!dedicatoria.imageUrl
    });
  }, [storySettings.dedicatoria, dedicatoria]);

  const [isUploading, setIsUploading] = useState(false);

  // Función helper para actualizar dedicatoria con persistencia explícita
  const updateDedicatoria = async (updates: Partial<DedicatoriaData>) => {
    const newDedicatoria = { ...dedicatoria, ...updates };
    console.log('[DedicatoriaStep] 🔄 Actualizando dedicatoria:', {
      updates,
      newDedicatoria,
      storyId,
      hasText: !!newDedicatoria.text,
      hasImage: !!newDedicatoria.imageUrl,
      imageSize: newDedicatoria.imageUrl ? newDedicatoria.imageUrl.length : 0
    });
    
    setDedicatoria(newDedicatoria);
    
    // Usar callback para evitar stale closures
    setStorySettings(prevSettings => ({
      ...prevSettings,
      dedicatoria: newDedicatoria
    }));

    // PERSISTENCIA EXPLÍCITA - Guardar inmediatamente en BD
    if (storyId) {
      try {
        console.log('[DedicatoriaStep] 🚀 Iniciando persistencia en BD...');
        await storyService.persistDedicatoria(storyId, {
          text: newDedicatoria.text,
          imageUrl: newDedicatoria.imageUrl,
          layout: newDedicatoria.layout,
          alignment: newDedicatoria.alignment,
          imageSize: newDedicatoria.imageSize
        });
        
        console.log('[DedicatoriaStep] ✅ Dedicatoria persistida exitosamente:', {
          storyId,
          text: newDedicatoria.text,
          hasImage: !!newDedicatoria.imageUrl
        });
        
        // Notificación silenciosa de éxito para debugging
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Guardado automático',
          'Cambios guardados exitosamente',
          NotificationPriority.LOW
        );
      } catch (error) {
        console.error('[DedicatoriaStep] ❌ Error persistiendo dedicatoria:', {
          error,
          storyId,
          data: newDedicatoria
        });
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error al guardar',
          'No se pudo guardar la dedicatoria. Inténtalo nuevamente.',
          NotificationPriority.HIGH
        );
      }
    } else {
      console.warn('[DedicatoriaStep] ⚠️ No hay storyId disponible para persistir');
    }
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
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        console.log('[DedicatoriaStep] 🖼️ Imagen procesada:', {
          size: imageUrl.length,
          type: file.type,
          name: file.name
        });
        
        await updateDedicatoria({ imageUrl });

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

  // Función para actualizar configuración de layout con type safety mejorado
  const handleLayoutChange = <K extends keyof DedicatoriaData>(
    field: K, 
    value: DedicatoriaData[K]
  ) => {
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
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-2">
          {isCompleted ? 'Dedicatoria Personal - Solo Lectura' : 'Dedicatoria Personal'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isCompleted ? 'Vista de solo lectura de tu dedicatoria' : 'Agrega un toque personal y emotivo a tu cuento'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-red-800 dark:text-red-200">
            <span className="font-medium">Error al verificar estado del cuento</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mt-2 text-center">
            {error}
          </p>
          <button
            onClick={retry}
            className="mt-3 mx-auto block px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {isCompleted && !error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Lock className="w-5 h-5" />
            <span className="font-medium">PDF generado - edición bloqueada</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 text-center">
            Los campos de dedicatoria ya no pueden modificarse porque el cuento ha sido finalizado y exportado
          </p>
        </div>
      )}

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
              placeholder={isCompleted ? "No hay texto de dedicatoria" : "Escribe tu mensaje personal..."}
              maxLength={300}
              disabled={isCompleted || isLoading || error}
              className={`w-full p-3 border rounded-lg resize-none
                        ${isCompleted || isLoading || error
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        }`}
              rows={4}
            />
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {dedicatoria.text.length}/300 caracteres
              </span>
            </div>

            {/* Ejemplos de dedicatoria */}
            {!isCompleted && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ejemplos:</p>
                <div className="space-y-1">
                  {ejemplosDedicatoria.map((ejemplo, index) => (
                    <button
                      key={index}
                      onClick={() => handleTextChange(ejemplo)}
                      disabled={isCompleted || isLoading || error}
                      className={`block text-sm text-left
                                ${isCompleted || isLoading || error
                                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                  : 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300'
                                }`}
                    >
                      "{ejemplo}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Carga de Imagen */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Imagen Personal (Opcional)
            </h3>
            
            {!dedicatoria.imageUrl ? (
              <div
                onClick={isCompleted || isLoading || error ? undefined : () => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                          ${isCompleted || isLoading || error
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
                    {isCompleted || isLoading || error ? (
                      <Lock className="mx-auto h-8 w-8 text-gray-400" />
                    ) : (
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    )}
                    <p className={`text-sm ${isCompleted || isLoading || error ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {isCompleted || isLoading || error ? 'Carga de imagen bloqueada' : 'Haz clic para subir una imagen'}
                    </p>
                    {!isCompleted && !isLoading && !error && (
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
                  src={dedicatoria.imageUrl}
                  alt="Imagen de dedicatoria"
                  className="w-full h-48 object-cover rounded-lg"
                />
                {!isCompleted && !isLoading && !error && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 
                              hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isCompleted && (
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
              onChange={handleImageUpload}
              disabled={isCompleted || isLoading || error}
              className="hidden"
            />
          </div>

          {/* Configuración de Layout */}
          {dedicatoria.imageUrl && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {isCompleted ? 'Configuración de Layout - Solo Lectura' : 'Configuración de Layout'}
              </h3>

              {/* Posición de imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posición de la imagen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'imagen-arriba' as const, label: 'Arriba' },
                    { value: 'imagen-abajo' as const, label: 'Abajo' },
                    { value: 'imagen-izquierda' as const, label: 'Izquierda' },
                    { value: 'imagen-derecha' as const, label: 'Derecha' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLayoutChange('layout', option.value)}
                      disabled={isCompleted || isLoading || error}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        isCompleted || isLoading || error
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : dedicatoria.layout === option.value
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
                    { value: 'pequena' as const, label: 'Pequeña' },
                    { value: 'mediana' as const, label: 'Mediana' },
                    { value: 'grande' as const, label: 'Grande' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLayoutChange('imageSize', option.value)}
                      disabled={isCompleted || isLoading || error}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        isCompleted || isLoading || error
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : dedicatoria.imageSize === option.value
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
                    { value: 'izquierda' as const, label: 'Izquierda', icon: AlignLeft },
                    { value: 'centro' as const, label: 'Centro', icon: AlignCenter },
                    { value: 'derecha' as const, label: 'Derecha', icon: AlignRight }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLayoutChange('alignment', option.value)}
                      disabled={isCompleted || isLoading || error}
                      className={`p-2 rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                        isCompleted || isLoading || error
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : dedicatoria.alignment === option.value
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