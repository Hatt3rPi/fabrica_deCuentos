import React, { useState, useEffect } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ChevronLeft, ChevronRight, RefreshCw, Pencil } from 'lucide-react';

const PreviewStep: React.FC = () => {
  const { generatedPages, setGeneratedPages, isGenerating, setIsGenerating } = useWizard();
  const [currentPage, setCurrentPage] = useState(0);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    // Simular tiempo de carga inicial
    setIsGenerating(true);
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [setIsGenerating]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(generatedPages.length - 1, prev + 1));
  };

  const handleEditPrompt = (pageId: string, currentPrompt: string) => {
    setEditingPrompt(pageId);
    setPromptText(currentPrompt);
  };

  const handleRegeneratePage = async (pageId: string, prompt: string) => {
    setIsGenerating(true);
    try {
      // Simular regeneración de imagen
      const updatedPages = generatedPages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              prompt,
              imageUrl: 'https://images.pexels.com/photos/3662157/pexels-photo-3662157.jpeg',
            }
          : page
      );
      setGeneratedPages(updatedPages);
    } finally {
      setIsGenerating(false);
      setEditingPrompt(null);
    }
  };

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin mb-4">
          <RefreshCw className="w-12 h-12 text-purple-600 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Generando tu cuento mágico
        </h3>
        <p className="text-gray-600">
          Estamos dando vida a tu historia. Este proceso puede tomar unos minutos...
        </p>
      </div>
    );
  }

  if (!generatedPages || generatedPages.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No hay páginas generadas
        </h3>
        <p className="text-gray-600">
          Por favor, completa los pasos anteriores para generar tu cuento.
        </p>
      </div>
    );
  }

  const currentPageData = generatedPages[currentPage];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-purple-800">Vista Previa del Cuento</h2>
        <p className="text-gray-600">
          Página {currentPage + 1} de {generatedPages.length}
        </p>
      </div>

      <div className="flex items-center justify-center gap-8">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className={`p-2 rounded-full ${
            currentPage === 0
              ? 'bg-gray-200 text-gray-400'
              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative w-[600px] aspect-square bg-white rounded-lg shadow-lg overflow-hidden">
          {currentPageData && (
            <>
              <img
                src={currentPageData.imageUrl}
                alt={`Página ${currentPage + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <p className="text-white text-lg">{currentPageData.text}</p>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage === generatedPages.length - 1}
          className={`p-2 rounded-full ${
            currentPage === generatedPages.length - 1
              ? 'bg-gray-200 text-gray-400'
              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-8">
        <div className="max-w-2xl mx-auto bg-purple-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <h4 className="text-sm font-medium text-purple-800 mb-1">Prompt de la imagen</h4>
              {editingPrompt === currentPageData?.id ? (
                <div className="space-y-2">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full p-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingPrompt(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleRegeneratePage(currentPageData.id, promptText)}
                      disabled={isGenerating}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        'Regenerar'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">{currentPageData?.prompt}</p>
              )}
            </div>
            {!editingPrompt && currentPageData && (
              <button
                onClick={() => handleEditPrompt(currentPageData.id, currentPageData.prompt)}
                className="p-1 text-purple-600 hover:text-purple-800"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewStep;