import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { useStory } from '../../context/StoryContext';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../types/notification';

const WizardNav: React.FC = () => {
  const {
    currentStep,
    prevStep,
    nextStep,
    canProceed,
    isGenerating,
    designSettings,
    setGeneratedPages,
    generateAllImagesParallel,
    completionResult,
    storySettings,
  } = useWizard();
  const { covers } = useStory();
  const { storyId } = useParams();
  const { createNotification } = useNotifications();

  const generateAllImages = async () => {
    if (!storyId) return;
    
    try {
      // First, handle cover image synchronously
      const coverUrl =
        covers[storyId]?.variants?.[designSettings.visualStyle] ||
        covers[storyId]?.url;
      if (coverUrl) {
        await storyService.updateCoverImage(storyId, coverUrl);
        setGeneratedPages(prev =>
          prev.map(p =>
            p.pageNumber === 0 ? { ...p, imageUrl: coverUrl } : p
          )
        );
      }
      
      // Then trigger parallel generation for all other pages
      await generateAllImagesParallel();
      
    } catch (err) {
      console.error('Error generating page images', err);
    }
  };

  const handleNextClick = async () => {
    if (canProceed()) {
      // Persistir dedicatoria antes de avanzar desde el paso de dedicatoria
      if (currentStep === 'dedicatoria' && storyId && storySettings.dedicatoria) {
        try {
          console.log('[WizardNav] Persistiendo dedicatoria antes de avanzar:', storySettings.dedicatoria);
          await storyService.persistDedicatoria(storyId, {
            text: storySettings.dedicatoria.text,
            imageUrl: storySettings.dedicatoria.imageUrl,
            layout: storySettings.dedicatoria.layout,
            alignment: storySettings.dedicatoria.alignment,
            imageSize: storySettings.dedicatoria.imageSize
          });
          console.log('[WizardNav] ✅ Dedicatoria persistida exitosamente antes de avanzar');
        } catch (error) {
          console.error('[WizardNav] ❌ Error persistiendo dedicatoria al avanzar:', error);
          createNotification(
            NotificationType.SYSTEM_UPDATE,
            'Error al guardar dedicatoria',
            'Hubo un problema guardando la dedicatoria. Inténtalo nuevamente.',
            NotificationPriority.HIGH
          );
          return; // No avanzar si hay error
        }
      }
      
      if (currentStep === 'design') {
        generateAllImages();
      }
      nextStep();
    }
  };

  // Función eliminada - la descarga se maneja en PreviewStep

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4 flex justify-between">
      <button
        onClick={prevStep}
        disabled={currentStep === 'characters' || isGenerating}
        className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
          currentStep === 'characters' || isGenerating
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-300 dark:border-purple-600 shadow-sm'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Anterior</span>
      </button>

      {currentStep === 'export' ? (
        completionResult?.success && completionResult.downloadUrl ? (
          <a
            href={completionResult.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-lg flex items-center gap-2 bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-700 dark:hover:bg-purple-800 shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Descargar cuento</span>
          </a>
        ) : (
          <div></div>
        )
      ) : (
        <button
          onClick={handleNextClick}
          disabled={!canProceed() || isGenerating}
          data-testid="wizard-next-button"
          className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
            !canProceed() || isGenerating
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-700 dark:hover:bg-purple-800 shadow-md transition-colors'
          }`}
        >
          <span>Siguiente</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default WizardNav;