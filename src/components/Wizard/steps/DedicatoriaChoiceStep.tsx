import React from 'react';
import { Heart, ArrowRight, Lock, Check } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { useWizardFlowStore } from '../../../stores/wizardFlowStore';
import { useParams } from 'react-router-dom';
import { storyService } from '../../../services/storyService';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { useWizardLockStatus } from '../../../hooks/useWizardLockStatus';

const DedicatoriaChoiceStep: React.FC = () => {
  const { nextStep, skipToStep } = useWizard();
  const { avanzarEtapa } = useWizardFlowStore();
  const { storyId } = useParams();
  const { createNotification } = useNotifications();
  const { 
    isStepLocked, 
    getLockReason, 
    isLoading, 
    error, 
    retry,
    dedicatoriaChoice,
    isPdfCompleted
  } = useWizardLockStatus();
  
  const isLocked = isStepLocked('dedicatoria-choice');
  const lockReason = getLockReason('dedicatoria-choice');

  const handleYes = async () => {
    // Persistir elección en BD
    if (storyId) {
      try {
        await storyService.persistDedicatoria(storyId, { chosen: true });
        console.log('[DedicatoriaChoiceStep] ✅ Elección "sí" persistida exitosamente');
      } catch (error) {
        console.error('[DedicatoriaChoiceStep] ❌ Error persistiendo elección "sí":', error);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error al guardar elección',
          'Hubo un problema guardando tu elección. Inténtalo nuevamente.',
          NotificationPriority.HIGH
        );
        return;
      }
    }
    
    // Marcar dedicatoria-choice como completado y avanzar a dedicatoria
    avanzarEtapa('dedicatoriaChoice');
    nextStep();
  };

  const handleNo = async () => {
    // Persistir elección en BD
    if (storyId) {
      try {
        await storyService.persistDedicatoria(storyId, { chosen: false });
        console.log('[DedicatoriaChoiceStep] ✅ Elección "no" persistida exitosamente');
      } catch (error) {
        console.error('[DedicatoriaChoiceStep] ❌ Error persistiendo elección "no":', error);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error al guardar elección',
          'Hubo un problema guardando tu elección. Inténtalo nuevamente.',
          NotificationPriority.HIGH
        );
        return;
      }
    }
    
    // Marcar dedicatoria-choice como completado
    avanzarEtapa('dedicatoriaChoice');
    // También marcar dedicatoria como completado (saltado)
    avanzarEtapa('dedicatoria');
    // Usar skipToStep para saltar directamente a export
    skipToStep('export');
  };

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
          {isLocked ? (
            <Lock className="w-10 h-10 text-gray-500 dark:text-gray-400" />
          ) : (
            <Heart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          )}
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {isLocked ? 'Dedicatoria - Solo Lectura' : '¿Te gustaría agregar una dedicatoria?'}
        </h2>
        
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
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
        ) : isLocked ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Lock className="w-5 h-5" />
              <span className="font-medium">{lockReason}</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              Esta opción ya no puede modificarse
            </p>
          </div>
        ) : (
          <>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              Personaliza tu cuento con un mensaje especial
            </p>
            
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Puedes incluir texto personalizado y/o una imagen para hacer tu cuento aún más único
            </p>
            
            {/* Mostrar elección previa si existe */}
            {dedicatoriaChoice !== null && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-800 dark:text-blue-200">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Selección previa: {dedicatoriaChoice ? 'Sí, agregar dedicatoria' : 'No, continuar'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
        <button
          onClick={handleYes}
          disabled={isLocked || isLoading || error}
          className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300
                     ${isLocked || isLoading || error
                       ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
                       : dedicatoriaChoice === true
                         ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                         : 'border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800'
                     }`}
        >
          <div className="relative z-10">
            {isLocked ? (
              <Lock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            ) : dedicatoriaChoice === true ? (
              <Check className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            ) : (
              <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            )}
            <h3 className={`font-semibold mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : dedicatoriaChoice === true ? 'text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
              Sí, agregar dedicatoria
              {dedicatoriaChoice === true && ' ✓'}
            </h3>
            <p className={`text-sm ${isLocked ? 'text-gray-400 dark:text-gray-500' : dedicatoriaChoice === true ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {isLocked ? 'Opción bloqueada' : dedicatoriaChoice === true ? 'Seleccionado previamente' : 'Personaliza con un mensaje especial'}
            </p>
          </div>
          {!isLocked && dedicatoriaChoice !== true && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
        </button>

        <button
          onClick={handleNo}
          disabled={isLocked || isLoading || error}
          className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300
                     ${isLocked || isLoading || error
                       ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
                       : dedicatoriaChoice === false
                         ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                         : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800'
                     }`}
        >
          <div className="relative z-10">
            {isLocked ? (
              <Lock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            ) : dedicatoriaChoice === false ? (
              <Check className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            ) : (
              <ArrowRight className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-3" />
            )}
            <h3 className={`font-semibold mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : dedicatoriaChoice === false ? 'text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
              No, continuar
              {dedicatoriaChoice === false && ' ✓'}
            </h3>
            <p className={`text-sm ${isLocked ? 'text-gray-400 dark:text-gray-500' : dedicatoriaChoice === false ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {isLocked ? 'Opción bloqueada' : dedicatoriaChoice === false ? 'Seleccionado previamente' : 'Ir directamente a la descarga'}
            </p>
          </div>
          {!isLocked && dedicatoriaChoice !== false && (
            <div className="absolute inset-0 bg-gray-50 dark:bg-gray-700/20 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-8">
        {isLocked 
          ? 'Esta selección ya no puede modificarse'
          : 'Siempre podrás editar tu cuento más tarde si cambias de opinión'
        }
      </p>
    </div>
  );
};

export default DedicatoriaChoiceStep;