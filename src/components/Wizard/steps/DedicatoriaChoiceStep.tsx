import React from 'react';
import { Heart, ArrowRight, Lock } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { useWizardFlowStore } from '../../../stores/wizardFlowStore';
import { useParams } from 'react-router-dom';
import { storyService } from '../../../services/storyService';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { useStoryCompletionStatus } from '../../../hooks/useStoryCompletionStatus';

const DedicatoriaChoiceStep: React.FC = () => {
  const { nextStep, skipToStep } = useWizard();
  const { avanzarEtapa } = useWizardFlowStore();
  const { storyId } = useParams();
  const { createNotification } = useNotifications();
  const { isCompleted, isLoading, error, retry } = useStoryCompletionStatus();

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
          {isCompleted ? (
            <Lock className="w-10 h-10 text-gray-500 dark:text-gray-400" />
          ) : (
            <Heart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          )}
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {isCompleted ? 'Dedicatoria - Solo Lectura' : '¿Te gustaría agregar una dedicatoria?'}
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
        ) : isCompleted ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Lock className="w-5 h-5" />
              <span className="font-medium">PDF generado - edición bloqueada</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              Esta opción ya no puede modificarse porque el cuento ha sido finalizado y exportado
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
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
        <button
          onClick={handleYes}
          disabled={isCompleted || isLoading || error}
          className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300
                     ${isCompleted || isLoading || error
                       ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
                       : 'border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800'
                     }`}
        >
          <div className="relative z-10">
            {isCompleted ? (
              <Lock className={`w-8 h-8 mx-auto mb-3 ${isCompleted ? 'text-gray-400' : 'text-purple-600 dark:text-purple-400'}`} />
            ) : (
              <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            )}
            <h3 className={`font-semibold mb-1 ${isCompleted ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
              Sí, agregar dedicatoria
            </h3>
            <p className={`text-sm ${isCompleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
              {isCompleted ? 'Opción bloqueada' : 'Personaliza con un mensaje especial'}
            </p>
          </div>
          {!isCompleted && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
        </button>

        <button
          onClick={handleNo}
          disabled={isCompleted || isLoading || error}
          className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300
                     ${isCompleted || isLoading || error
                       ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
                       : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800'
                     }`}
        >
          <div className="relative z-10">
            {isCompleted ? (
              <Lock className={`w-8 h-8 mx-auto mb-3 ${isCompleted ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`} />
            ) : (
              <ArrowRight className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-3" />
            )}
            <h3 className={`font-semibold mb-1 ${isCompleted ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
              No, continuar
            </h3>
            <p className={`text-sm ${isCompleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
              {isCompleted ? 'Opción bloqueada' : 'Ir directamente a la descarga'}
            </p>
          </div>
          {!isCompleted && (
            <div className="absolute inset-0 bg-gray-50 dark:bg-gray-700/20 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-8">
        {isCompleted 
          ? 'Esta selección ya no puede modificarse una vez que el PDF ha sido generado'
          : 'Siempre podrás editar tu cuento más tarde si cambias de opinión'
        }
      </p>
    </div>
  );
};

export default DedicatoriaChoiceStep;