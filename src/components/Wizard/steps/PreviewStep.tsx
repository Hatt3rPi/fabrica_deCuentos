import React, { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ChevronLeft, ChevronRight, RefreshCw, Pencil, Download, BookOpen, CheckCircle } from 'lucide-react';
import { OverlayLoader } from '../../UI/Loader';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { useStoryStyles } from '../../../hooks/useStoryStyles';
import { useImageDimensions } from '../../../hooks/useImageDimensions';
import InlineTextEditor from './components/InlineTextEditor';
import AdvancedEditModal from './components/AdvancedEditModal';

const PreviewStep: React.FC = () => {
  const { 
    generatedPages, 
    isGenerating, 
    setIsGenerating, 
    isRegeneratingModal,
    setIsRegeneratingModal,
    generatePageImage,
    generateCoverImage,
    updatePageContent,
    updateStoryTitle,
    bulkGenerationProgress,
    pageStates,
    retryFailedPages,
    // Story completion functionality
    completeStory,
    isCompleting,
    completionResult,
    isPdfOutdated
  } = useWizard();
  const { createNotification } = useNotifications();
  const [currentPage, setCurrentPage] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const handleFallback = () => setIsGenerating(false);

  // Style hooks for dynamic preview
  const { getTextStyles, getContainerStyles, getPosition, getBackgroundImage, styleConfig } = useStoryStyles();

  // Función para guardar texto inline
  const handleSaveText = async (pageId: string, newText: string) => {
    try {
      // Encontrar la página que se está editando
      const pageData = generatedPages.find(page => page.id === pageId);
      const isCoverPage = pageData?.pageNumber === 0;
      
      await updatePageContent(pageId, { text: newText });
      
      // Si es la portada, actualizar también el título del cuento
      if (isCoverPage) {
        updateStoryTitle(newText);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Título actualizado',
          'El título del cuento se actualizó correctamente',
          NotificationPriority.LOW
        );
      } else {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Texto actualizado',
          'El texto se guardó correctamente',
          NotificationPriority.LOW
        );
      }
    } catch (error) {
      console.error('Error saving text:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error al guardar',
        'No se pudo guardar el texto',
        NotificationPriority.HIGH
      );
      throw error;
    }
  };

  // Función para manejar el modal avanzado
  const handleAdvancedEdit = () => {
    setShowAdvancedModal(true);
  };

  const handleAdvancedSave = async (updates: { text?: string; prompt?: string }) => {
    const currentPageData = generatedPages[currentPage];
    if (!currentPageData) return;

    try {
      const isCoverPage = currentPageData.pageNumber === 0;
      
      await updatePageContent(currentPageData.id, updates);
      
      // Si es la portada y se está actualizando el texto, actualizar también el título
      if (isCoverPage && updates.text) {
        updateStoryTitle(updates.text);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Portada actualizada',
          'El título y contenido se guardaron correctamente',
          NotificationPriority.LOW
        );
      } else {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Contenido actualizado',
          'Los cambios se guardaron correctamente',
          NotificationPriority.LOW
        );
      }
    } catch (error) {
      console.error('Error saving advanced changes:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error al guardar',
        'No se pudieron guardar los cambios',
        NotificationPriority.HIGH
      );
      throw error;
    }
  };

  const handleAdvancedRegenerate = async (prompt: string) => {
    const currentPageData = generatedPages[currentPage];
    if (!currentPageData) return;

    try {
      setIsRegeneratingModal(true);
      const isCover = currentPageData.pageNumber === 0;
      if (isCover) {
        await generateCoverImage(prompt);
      } else {
        await generatePageImage(currentPageData.id, prompt);
      }
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Imagen regenerada',
        'La imagen se regeneró con el nuevo prompt',
        NotificationPriority.LOW
      );
    } catch (error) {
      console.error('Error regenerating from advanced modal:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error al regenerar',
        'No se pudo regenerar la imagen',
        NotificationPriority.HIGH
      );
      throw error;
    } finally {
      setIsRegeneratingModal(false);
    }
  };

  // Removed simulated loading - now using real progress from parallel generation

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(generatedPages.length - 1, prev + 1));
  };


  const handleCompleteStory = async () => {
    try {
      // Siempre guardar en biblioteca personal
      const result = await completeStory(true);
      
      // Debug logging solo en desarrollo
      if (import.meta.env.DEV) {
        console.log('Story completion result:', result);
      }
      
      if (result.success) {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Cuento finalizado',
          'Tu cuento se ha completado exitosamente y se está descargando',
          NotificationPriority.HIGH
        );
        setShowCompletionModal(false);
        setShowSuccessNotification(true);
        
        // Descargar automáticamente el PDF con fallback
        if (result.downloadUrl) {
          if (import.meta.env.DEV) {
            console.log('Triggering automatic download:', result.downloadUrl);
          }
          
          try {
            const link = document.createElement('a');
            link.href = result.downloadUrl;
            link.download = `cuento-${Date.now()}.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (downloadError) {
            // Fallback: mostrar enlace manual si la descarga automática falla
            console.warn('Automatic download failed:', downloadError);
            createNotification(
              NotificationType.SYSTEM_UPDATE,
              'Descarga disponible',
              'La descarga automática falló. Haz clic aquí para descargar tu cuento manualmente.',
              NotificationPriority.MEDIUM
            );
            
            // Abrir en nueva ventana como fallback
            window.open(result.downloadUrl, '_blank');
          }
        }
        
        // Auto-cerrar notificación después de 8 segundos
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 8000);
      } else {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error al finalizar',
          result.error || 'No se pudo finalizar el cuento',
          NotificationPriority.HIGH
        );
      }
    } catch (error) {
      console.error('Error completing story:', error);
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

  // Get styles for current page
  const textStyles = getTextStyles(currentPage);
  const containerStyles = getContainerStyles(currentPage);
  const position = getPosition(currentPage);
  const backgroundImage = getBackgroundImage(currentPage, currentPageData?.imageUrl);
  const imageDimensions = useImageDimensions(backgroundImage);

  // Use exact fontSize from configuration to ensure consistency
  const exactFontSize = textStyles.fontSize || '16px';

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

        <div className="w-full max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div 
                className={`
                  relative bg-gray-100 dark:bg-gray-700 bg-cover bg-center
                  ${imageDimensions.loaded 
                    ? imageDimensions.aspectRatio > 1.2 
                      ? 'aspect-[4/3] sm:aspect-[3/2]' // Landscape
                      : imageDimensions.aspectRatio < 0.8 
                        ? 'aspect-[3/4] sm:aspect-[2/3]' // Portrait
                        : 'aspect-square' // Square
                    : 'aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4]' // Default fallback
                  }
                `}
                style={{
                  backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
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

              {/* Edit button overlay - top left */}
              {currentPageData && !isGenerating && pageStates[currentPageData.id] !== 'generating' && (
                <button
                  onClick={handleAdvancedEdit}
                  className="absolute top-2 left-2 w-8 h-8 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-gray-700 hover:text-purple-600 transition-all duration-200 z-20 group hover:scale-110"
                  title="Editar contenido y prompt"
                >
                  <Pencil className="w-4 h-4 transition-transform group-hover:scale-110" />
                </button>
              )}
              
                    {/* Text overlay with dynamic positioning */}
                    <div 
                      className={`
                        absolute inset-0 flex justify-center
                        px-3 sm:px-6 md:px-8
                        ${position === 'top' 
                          ? 'items-start pt-4 sm:pt-6 md:pt-8' 
                          : position === 'center' 
                            ? 'items-center' 
                            : 'items-end pb-4 sm:pb-6 md:pb-8'
                        }
                      `}
                    >
                      <div 
                        style={{
                          ...containerStyles,
                          maxWidth: containerStyles.maxWidth || '100%',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: styleConfig?.pageConfig.text.verticalAlign || 'flex-end'
                        }}
                        className="relative"
                      >
                        <InlineTextEditor
                          initialText={currentPage === 0 ? generatedPages[0]?.text || '' : currentPageData.text}
                          onSave={(newText) => handleSaveText(currentPageData.id, newText)}
                          textStyles={{
                            ...textStyles,
                            width: '100%',
                            fontSize: exactFontSize,
                            lineHeight: textStyles.lineHeight || '1.4'
                          }}
                          className="text-center sm:text-left"
                          config={{
                            autoSaveDelay: 2000,
                            showIndicators: true,
                            multiline: true,
                            placeholder: 'Doble-click para editar el texto...'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
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
              {allPagesCompleted ? '🎉 ¡Tu cuento está listo!' : '⏳ Preparando tu cuento...'}
            </h3>
            <p className="text-gray-600 mb-4">
              {allPagesCompleted 
                ? 'Todas las páginas se han generado correctamente. Puedes finalizar tu cuento.'
                : 'Algunas páginas aún están en proceso. Puedes finalizar cuando estén listas.'
              }
            </p>
            
            {/* Progress indicator when pages are still generating */}
            {!allPagesCompleted && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                  <span>Progreso:</span>
                  <span className="font-semibold">
                    {generatedPages.filter(p => p.imageUrl && pageStates[p.id] === 'completed').length} / {generatedPages.length} páginas
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(generatedPages.filter(p => p.imageUrl && pageStates[p.id] === 'completed').length / generatedPages.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Botones centrados */}
          <div className="flex justify-center gap-4">
            {/* Botón Finalizar Cuento - solo visible si no se ha completado */}
            {!completionResult?.success && (
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
            )}

          </div>

          {/* Error state */}
          {completionResult?.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <span className="font-semibold">Error:</span> {completionResult.error}
              </p>
            </div>
          )}

          {/* PDF outdated state */}
          {completionResult?.success && isPdfOutdated && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800">
                <span className="font-semibold">⚠️ PDF desactualizado:</span> Has regenerado algunas imágenes. Finaliza el cuento nuevamente para actualizar el PDF.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notificación de éxito - reemplaza el contenedor verde */}
      {completionResult?.success && showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 animate-slide-in-right">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-green-800 mb-1">
                  ¡Cuento completado exitosamente!
                </h4>
                <p className="text-sm text-green-700">
                  Tu cuento ha sido generado y está listo para descargar.
                </p>
              </div>
              <button 
                onClick={() => setShowSuccessNotification(false)}
                className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Finalizar Cuento
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6 text-center">
              Tu cuento será marcado como completado, se guardará en tu biblioteca personal y se descargará automáticamente un archivo PDF con todas las páginas e ilustraciones.
            </p>

            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 bg-purple-600 rounded flex items-center justify-center"
                  role="status"
                  aria-label="Guardado automáticamente en biblioteca"
                >
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <div>
                  <span className="text-gray-700 font-medium">
                    Se guardará en tu biblioteca personal
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Podrás acceder a tu cuento desde tu perfil en cualquier momento y descargarlo nuevamente.
                  </p>
                </div>
              </div>
            </div>

            {isCompleting && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Generando PDF...</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Esto puede tomar unos momentos mientras se procesa tu cuento.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCompletionModal(false)}
                disabled={isCompleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteStory}
                disabled={isCompleting}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg disabled:bg-gray-400 flex items-center gap-2 transition-all transform hover:scale-105 disabled:transform-none"
              >
                {isCompleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Finalizar y Descargar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Edit Modal */}
      {showAdvancedModal && currentPageData && (
        <AdvancedEditModal
          isOpen={showAdvancedModal}
          onClose={() => setShowAdvancedModal(false)}
          pageData={{
            id: currentPageData.id,
            text: currentPageData.text,
            prompt: currentPageData.prompt,
            pageNumber: currentPageData.pageNumber,
            imageUrl: currentPageData.imageUrl
          }}
          onSave={handleAdvancedSave}
          onRegenerate={handleAdvancedRegenerate}
          isRegenerating={isRegeneratingModal}
        />
      )}
    </div>
  );
};

export default PreviewStep;