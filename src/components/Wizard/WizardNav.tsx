import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { useStory } from '../../context/StoryContext';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { storyService } from '../../services/storyService';

const WizardNav: React.FC = () => {
  const {
    currentStep,
    prevStep,
    nextStep,
    canProceed,
    isGenerating,
    designSettings,
    generatedPages,
    setGeneratedPages,
    setIsGenerating,
  } = useWizard();
  const { covers } = useStory();
  const { storyId } = useParams();

  const generateAllImages = async () => {
    if (!storyId) return;
    setIsGenerating(true);
    try {
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
      for (const page of generatedPages) {
        if (page.pageNumber === 0) continue;
        const url = await storyService.generatePageImage(
          storyId,
          page.id
        );
        setGeneratedPages(prev =>
          prev.map(p => (p.id === page.id ? { ...p, imageUrl: url } : p))
        );
      }
    } catch (err) {
      console.error('Error generating page images', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextClick = () => {
    if (canProceed()) {
      if (currentStep === 'design') {
        generateAllImages();
      }
      nextStep();
    }
  };

  const handleDownloadPDF = () => {
    // Simulación de descarga de PDF
    alert('Descargando PDF...');
  };

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

      {currentStep === 'preview' ? (
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
            isGenerating
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-700 dark:hover:bg-purple-800 shadow-md transition-colors'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Descargar PDF</span>
        </button>
      ) : (
        <button
          onClick={handleNextClick}
          disabled={!canProceed() || isGenerating}
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