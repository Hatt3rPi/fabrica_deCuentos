import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { useWizardFlowStore } from '../../../stores/wizardFlowStore';
import { useParams } from 'react-router-dom';
import { storyService } from '../../../services/storyService';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';

const DedicatoriaChoiceStep: React.FC = () => {
  const { setCurrentStep, nextStep } = useWizard();
  const { avanzarEtapa } = useWizardFlowStore();
  const { storyId } = useParams();
  const { createNotification } = useNotifications();

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
    setCurrentStep('dedicatoria');
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
    
    // Marcar dedicatoria-choice como completado y saltar directamente a export
    avanzarEtapa('dedicatoriaChoice');
    // También marcar dedicatoria como completado (saltado)
    avanzarEtapa('dedicatoria');
    setCurrentStep('export');
  };

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
          <Heart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          ¿Te gustaría agregar una dedicatoria?
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Personaliza tu cuento con un mensaje especial
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Puedes incluir texto personalizado y/o una imagen para hacer tu cuento aún más único
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
        <button
          onClick={handleYes}
          className="group relative overflow-hidden rounded-xl border-2 border-purple-300 dark:border-purple-600 p-6 
                     hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300
                     hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800"
        >
          <div className="relative z-10">
            <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Sí, agregar dedicatoria
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personaliza con un mensaje especial
            </p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        <button
          onClick={handleNo}
          className="group relative overflow-hidden rounded-xl border-2 border-gray-300 dark:border-gray-600 p-6 
                     hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300
                     hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800"
        >
          <div className="relative z-10">
            <ArrowRight className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              No, continuar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ir directamente a la descarga
            </p>
          </div>
          <div className="absolute inset-0 bg-gray-50 dark:bg-gray-700/20 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-8">
        Siempre podrás editar tu cuento más tarde si cambias de opinión
      </p>
    </div>
  );
};

export default DedicatoriaChoiceStep;