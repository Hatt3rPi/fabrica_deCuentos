import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { storyService } from '../../../services/storyService';
import { useWizardLockStatus } from '../../../hooks/useWizardLockStatus';
import DedicatoriaTextEditor from './components/DedicatoriaTextEditor';
import ImageUploader from './components/ImageUploader';
import LayoutConfig from './components/LayoutConfig';
import DedicatoriaPreview from './components/DedicatoriaPreview';

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
  const { storyId } = useParams();
  const { 
    isStepLocked, 
    getLockReason, 
    isLoading, 
    error, 
    retry 
  } = useWizardLockStatus();
  
  const isLocked = isStepLocked('dedicatoria');
  const lockReason = getLockReason('dedicatoria');

  // Estado inicial de la dedicatoria
  const [dedicatoria, setDedicatoria] = useState<DedicatoriaData>({
    text: storySettings.dedicatoria?.text || '',
    imageUrl: storySettings.dedicatoria?.imageUrl || undefined,
    layout: storySettings.dedicatoria?.layout || 'imagen-arriba',
    alignment: storySettings.dedicatoria?.alignment || 'centro',
    imageSize: storySettings.dedicatoria?.imageSize || 'mediana'
  });

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-2">
          {isLocked ? 'Dedicatoria Personal - Solo Lectura' : 'Dedicatoria Personal'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isLocked ? 'Vista de solo lectura de tu dedicatoria' : 'Agrega un toque personal y emotivo a tu cuento'}
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

      {isLocked && !error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Lock className="w-5 h-5" />
            <span className="font-medium">{lockReason}</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 text-center">
            Los campos de dedicatoria ya no pueden modificarse
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Configuración */}
        <div className="space-y-6">
          <DedicatoriaTextEditor
            text={dedicatoria.text}
            isDisabled={isLocked || isLoading || !!error}
            onTextChange={handleTextChange}
          />

          <ImageUploader
            imageUrl={dedicatoria.imageUrl}
            isUploading={isUploading}
            isDisabled={isLocked || isLoading || !!error}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
          />

          {dedicatoria.imageUrl && (
            <LayoutConfig
              layout={dedicatoria.layout}
              alignment={dedicatoria.alignment}
              imageSize={dedicatoria.imageSize}
              isDisabled={isLocked || isLoading || !!error}
              onLayoutChange={handleLayoutChange}
            />
          )}
        </div>

        {/* Panel de Vista Previa */}
        <DedicatoriaPreview
          text={dedicatoria.text}
          imageUrl={dedicatoria.imageUrl}
          layout={dedicatoria.layout}
          alignment={dedicatoria.alignment}
          imageSize={dedicatoria.imageSize}
        />
      </div>
    </div>
  );
};

export default DedicatoriaStep;