import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';

const WizardNav: React.FC = () => {
  const { currentStep, prevStep, nextStep, canProceed, isGenerating } = useWizard();

  const handleNextClick = () => {
    if (canProceed()) {
      nextStep();
    }
  };

  const handleDownloadPDF = () => {
    // Simulación de descarga de PDF
    alert('Descargando PDF...');
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-between">
      <button
        onClick={prevStep}
        disabled={currentStep === 'characters' || isGenerating}
        className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
          currentStep === 'characters' || isGenerating
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-300 shadow-sm'
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
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md transition-colors'
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
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md transition-colors'
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