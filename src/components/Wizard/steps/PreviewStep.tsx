import React, { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ChevronLeft, ChevronRight, RefreshCw, Pencil, Download, BookOpen, CheckCircle } from 'lucide-react';
import { OverlayLoader } from '../../UI/Loader';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';

const PreviewStep: React.FC = () => {
  const { 
    generatedPages, 
    isGenerating, 
    setIsGenerating, 
    generatePageImage,
    bulkGenerationProgress,
    pageStates,
    retryFailedPages,
    // Story completion functionality
    completeStory,
    isCompleting,
    completionResult
  } = useWizard();
  const { createNotification } = useNotifications();
  const [currentPage, setCurrentPage] = useState(0);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const handleFallback = () => setIsGenerating(false);

  // Removed simulated loading - now using real progress from parallel generation

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

  const handleRegeneratePage = async (pageId: string) => {
    try {
      await generatePageImage(pageId);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Imagen actualizada',
        'La página se regeneró correctamente',
        NotificationPriority.LOW
      );
    } catch (err) {
      console.error('Error regenerating page', err);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error al regenerar',
        'No se pudo generar la nueva imagen',
        NotificationPriority.HIGH
      );
    } finally {
      setEditingPrompt(null);
    }
  };

  const handleCompleteStory = async () => {
    try {
      const result = await completeStory(saveToLibrary);
      if (result.success) {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Cuento finalizado',
          'Tu cuento se ha completado exitosamente',
          NotificationPriority.HIGH
        );
        setShowCompletionModal(false);
      } else {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error al finalizar',
          result.error || 'No se pudo finalizar el cuento',
          NotificationPriority.HIGH
        );
      }
    } catch {
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error al finalizar',
        'Ocurrió un error inesperado',
        NotificationPriority.HIGH
      );
    }
  };

  const allPagesCompleted = generatedPages.every(page => 
    page.imageUrl && pageStates[page.id] !== 'error' && pageStates[page.id] !== 'generating'
  );

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
              {/* Show page state indicator */}
              {pageStates[currentPageData.id] === 'generating' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-gray-600">Generando página {currentPage + 1}...</p>
                  </div>
                </div>
              )}
              
              {pageStates[currentPageData.id] === 'error' && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs z-10">
                  Error en generación
                </div>
              )}
              
              {pageStates[currentPageData.id] === 'completed' && currentPageData.imageUrl && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs z-10">
                  ✓ Completada
                </div>
              )}
              
              <img
                src={currentPageData.imageUrl || '/placeholder-image.png'}
                alt={`Página ${currentPage + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback para imágenes rotas
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
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
      {isGenerating && (
        <OverlayLoader 
          etapa="vista_previa_parallel" 
          progress={{ 
            current: bulkGenerationProgress.completed, 
            total: bulkGenerationProgress.total 
          }}
          context={{ 
            current: bulkGenerationProgress.completed.toString(),
            total: bulkGenerationProgress.total.toString(),
            estilo: 'artístico'
          }}
          onFallback={handleFallback} 
        />
      )}
      
      {/* Show retry button if there are failed pages and not currently generating */}
      {!isGenerating && bulkGenerationProgress.failed > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={retryFailedPages}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar {bulkGenerationProgress.failed} página{bulkGenerationProgress.failed > 1 ? 's' : ''} fallida{bulkGenerationProgress.failed > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Story Completion Section */}
      <div className="mt-12 max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-purple-800 mb-2">
              ¡Tu cuento está listo!
            </h3>
            <p className="text-gray-600">
              {allPagesCompleted 
                ? 'Todas las páginas se han generado correctamente. Puedes finalizar tu cuento.'
                : 'Algunas páginas aún están en proceso. Puedes finalizar cuando estén listas.'
              }
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setShowCompletionModal(true)}
              disabled={isGenerating || isCompleting || !allPagesCompleted}
              className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                allPagesCompleted && !isGenerating && !isCompleting
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCompleting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Finalizando cuento...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Finalizar Cuento
                </>
              )}
            </button>
          </div>

          {completionResult?.success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">¡Cuento completado exitosamente!</span>
              </div>
              {completionResult.downloadUrl && (
                <a
                  href={completionResult.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 underline"
                >
                  <Download className="w-4 h-4" />
                  Descargar cuento
                </a>
              )}
            </div>
          )}

          {completionResult?.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <span className="font-semibold">Error:</span> {completionResult.error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Finalizar Cuento
            </h3>
            
            <p className="text-gray-600 mb-6">
              Tu cuento será marcado como completado y se generará un archivo descargable.
            </p>

            <div className="mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700">
                  Guardar en mi biblioteca personal
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-7">
                Podrás acceder a tu cuento desde tu perfil en cualquier momento
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCompletionModal(false)}
                disabled={isCompleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteStory}
                disabled={isCompleting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:bg-gray-400 flex items-center gap-2"
              >
                {isCompleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Finalizar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewStep;