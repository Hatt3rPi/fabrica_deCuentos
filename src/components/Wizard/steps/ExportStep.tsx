import React, { useState, useEffect } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { Download, Copy, Check, Loader, BookOpen, CheckCircle } from 'lucide-react';
import Button from '../../UI/Button';

const ExportStep: React.FC = () => {
  const { 
    completeStory, 
    isCompleting, 
    completionResult,
    generatedPages 
  } = useWizard();
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Completar el story automáticamente cuando llegamos a esta etapa
    if (!completionResult && !isCompleting) {
      completeStory(saveToLibrary);
    }
  }, [saveToLibrary]);

  const handleExport = async () => {
    if (!completionResult?.success) {
      await completeStory(saveToLibrary);
    }
  };

  const copyLink = async () => {
    if (completionResult?.downloadUrl) {
      await navigator.clipboard.writeText(completionResult.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-2">
          ¡Tu Cuento Está Listo!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Finaliza y descarga tu cuento personalizado
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-6">
        {/* Resumen del cuento */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Resumen del Cuento
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Páginas:</span>
              <span className="ml-2 font-medium">{generatedPages.length}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Estado:</span>
              <span className="ml-2 font-medium text-green-600">Completado</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="saveToLibrary"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="saveToLibrary" className="text-gray-700 dark:text-gray-300">
            Guardar en mi biblioteca personal
          </label>
        </div>

        {isCompleting ? (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600 dark:text-gray-400">Finalizando tu cuento...</p>
          </div>
        ) : completionResult?.success ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">¡Cuento completado exitosamente!</span>
            </div>
            
            <a
              href={completionResult.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-4 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 text-center font-medium transition-colors"
            >
              <Download className="w-5 h-5 inline-block mr-2" />
              Descargar Cuento PDF
            </a>
            
            <button
              onClick={copyLink}
              className="w-full py-3 px-4 border border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copiar enlace</span>
                </>
              )}
            </button>
          </div>
        ) : completionResult?.error ? (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400">
                <span className="font-semibold">Error:</span> {completionResult.error}
              </p>
            </div>
            <Button
              onClick={handleExport}
              className="w-full"
            >
              <Download className="w-5 h-5" />
              <span>Intentar nuevamente</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleExport}
            className="w-full"
          >
            <BookOpen className="w-5 h-5" />
            <span>Finalizar Cuento</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExportStep;