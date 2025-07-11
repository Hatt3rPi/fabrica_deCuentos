import React, { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ChevronLeft, ChevronRight, RefreshCw, Pencil, Lock } from 'lucide-react';
import { OverlayLoader } from '../../UI/Loader';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { useStoryStyles } from '../../../hooks/useStoryStyles';
import { useImageDimensions } from '../../../hooks/useImageDimensions';
import InlineTextEditor from './components/InlineTextEditor';
import AdvancedEditModal from './components/AdvancedEditModal';
import { useWizardLockStatus } from '../../../hooks/useWizardLockStatus';
import StoryRenderer from '../../StoryRenderer';
import TemplateRenderer from '../../unified/TemplateRenderer';
import { PageType } from '../../../utils/storyStyleUtils';
import { UnifiedRenderOptions } from '../../../types/unifiedTemplate';

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
    isPdfOutdated,
    // Loader messages from story
    loaderMessages
  } = useWizard();
  const { createNotification } = useNotifications();
  const [currentPage, setCurrentPage] = useState(0);
  // showCompletionModal removido - funcionalidad movida a ExportStep
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const handleFallback = () => setIsGenerating(false);
  const { 
    isStepLocked, 
    getLockReason, 
    isLoading, 
    error, 
    retry 
  } = useWizardLockStatus();
  
  const isLocked = isStepLocked('preview');
  const lockReason = getLockReason('preview');

  // Style hooks for dynamic preview (mantener para compatibilidad con modal avanzado)
  const { getTextStyles, getContainerStyles, getPosition, getBackgroundImage, styleConfig } = useStoryStyles();
  
  // Flag para usar el sistema unificado (por defecto activado)
  const [useUnifiedRenderer] = useState(true);

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
    if (isLocked || isLoading) {
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Edición bloqueada',
        'No puedes editar el cuento porque el PDF ya ha sido generado',
        NotificationPriority.HIGH
      );
      return;
    }
    if (error) {
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error de conexión',
        'No se puede verificar el estado del cuento. Intenta nuevamente.',
        NotificationPriority.HIGH
      );
      return;
    }
    setShowAdvancedModal(true);
  };

  const handleAdvancedSave = async (updates: { text?: string; prompt?: string }) => {
    const currentPageData = generatedPages[currentPage];
    if (!currentPageData) return;

    try {
      const isCoverPage = currentPageData.pageNumber === 0;
      
      // Para la portada, validar que tenemos un ID válido antes de intentar actualizar
      if (isCoverPage && (!currentPageData.id || currentPageData.id === 'undefined')) {
        // Si es la portada y no tenemos un ID válido, solo actualizar el estado local
        // La información se guardará cuando se complete el cuento
        if (updates.text) {
          updateStoryTitle(updates.text);
        }
        // Actualizar el estado local de las páginas para reflejar los cambios del prompt
        if (updates.prompt) {
          setGeneratedPages(prev => prev.map(p =>
            p.pageNumber === 0 ? { ...p, prompt: updates.prompt! } : p
          ));
        }
        
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Portada actualizada',
          'Los cambios se aplicaron correctamente',
          NotificationPriority.LOW
        );
      } else {
        // Para páginas normales o portadas con ID válido, actualizar en base de datos
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

  // Get styles for current page (mantener para compatibilidad con modal avanzado)
  const textStyles = getTextStyles(currentPage);
  const containerStyles = getContainerStyles(currentPage);
  const position = getPosition(currentPage);
  const backgroundImage = getBackgroundImage(currentPage, currentPageData?.imageUrl);
  const imageDimensions = useImageDimensions(backgroundImage);

  // Use exact fontSize from configuration to ensure consistency
  const exactFontSize = textStyles.fontSize || '16px';

  // Determinar tipo de página para StoryRenderer
  const getPageType = (pageIndex: number): PageType => {
    if (pageIndex === 0) return 'cover';
    // Asumimos que todas las otras páginas son de tipo 'page'
    // Si hay dedicatoria específica, se podría detectar aquí
    return 'page';
  };

  const currentPageType = getPageType(currentPage);
  const currentPageText = currentPage === 0 ? generatedPages[0]?.text || '' : currentPageData?.text || '';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">
          {isLocked ? 'Vista Previa - Solo Lectura' : 'Vista Previa del Cuento'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Página {currentPage + 1} de {generatedPages.length}
        </p>
        
        {error && (
          <div className="mt-4 mx-auto max-w-md">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-red-800 dark:text-red-200">
                <span className="text-sm font-medium">Error al verificar estado del cuento</span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1 text-center">
                {error}
              </p>
              <button
                onClick={retry}
                className="mt-2 mx-auto block px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
        
        {isLocked && !error && (
          <div className="mt-4 mx-auto max-w-md">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">{lockReason}</span>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                El contenido ya no puede modificarse
              </p>
            </div>
          </div>
        )}
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
                  relative bg-gray-100 dark:bg-gray-700
                  ${imageDimensions.loaded 
                    ? imageDimensions.aspectRatio > 1.2 
                      ? 'aspect-[4/3] sm:aspect-[3/2]' // Landscape
                      : imageDimensions.aspectRatio < 0.8 
                        ? 'aspect-[3/4] sm:aspect-[2/3]' // Portrait
                        : 'aspect-square' // Square
                    : 'aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4]' // Default fallback
                  }
                `}
              >
                {currentPageData && (
                  <>
                    {/* Show page state indicator */}
                    {pageStates[currentPageData.id] === 'generating' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                        <div className="bg-white rounded-lg p-4 text-center">
                          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                          <p className="text-sm text-gray-600">Generando página {currentPage + 1}...</p>
                        </div>
                      </div>
                    )}
                    
                    {pageStates[currentPageData.id] === 'error' && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs z-30">
                        Error en generación
                      </div>
                    )}
                    
                    {pageStates[currentPageData.id] === 'completed' && currentPageData.imageUrl && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs z-30">
                        ✓ Completada
                      </div>
                    )}

                    {/* Edit button overlay - top left */}
                    {!isGenerating && pageStates[currentPageData.id] !== 'generating' && (
                      <button
                        onClick={handleAdvancedEdit}
                        disabled={isLocked || isLoading || error}
                        className={`absolute top-2 left-2 w-8 h-8 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-30 group ${
                          isLocked || isLoading || error
                            ? 'bg-gray-200/90 text-gray-400 cursor-not-allowed'
                            : 'bg-white/90 hover:bg-white hover:shadow-xl text-gray-700 hover:text-purple-600 hover:scale-110'
                        }`}
                        title={isLocked || isLoading || error ? 'Edición bloqueada' : 'Editar contenido y prompt'}
                      >
                        {isLocked || isLoading || error ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Pencil className="w-4 h-4 transition-transform group-hover:scale-110" />
                        )}
                      </button>
                    )}
                    
                    {/* Renderizado usando sistema unificado o legacy */}
                    <div className="absolute inset-0">
                      {useUnifiedRenderer ? (
                        /* Sistema unificado */
                        <TemplateRenderer
                          config={styleConfig}
                          pageType={currentPageType === 'page' ? 'content' : currentPageType}
                          content={{
                            title: currentPageType === 'cover' ? currentPageText : undefined,
                            text: currentPageType !== 'cover' ? currentPageText : undefined,
                            authorName: currentPageType === 'cover' ? 'Por Autor' : undefined
                          }}
                          renderOptions={{
                            context: 'wizard',
                            enableScaling: true,
                            preserveAspectRatio: true,
                            targetDimensions: { width: 1536, height: 1024 },
                            features: {
                              enableAnimations: false,
                              enableInteractions: false,
                              enableDebugInfo: false,
                              enableValidation: true
                            },
                            performance: {
                              lazyLoadImages: true,
                              optimizeFor: 'balance'
                            }
                          } as UnifiedRenderOptions}
                          debug={false}
                        />
                      ) : (
                        /* Sistema legacy */
                        <StoryRenderer
                          config={styleConfig}
                          pageType={currentPageType}
                          content={currentPageText}
                          imageUrl={currentPageData?.imageUrl}
                          context="wizard"
                          dimensions={{ 
                            width: 1536, 
                            height: 1024 
                          }}
                          instanceId={`wizard-page-${currentPage}`}
                          debug={false}
                        />
                      )}
                      
                      {/* Overlay de edición inline */}
                      {!isLocked && !isLoading && !error && !useUnifiedRenderer && (
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
                          style={{ zIndex: 25 }}
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
                              initialText={currentPageText}
                              onSave={(newText) => handleSaveText(currentPageData.id, newText)}
                              textStyles={{
                                ...textStyles,
                                width: '100%',
                                fontSize: exactFontSize,
                                lineHeight: textStyles.lineHeight || '1.4',
                                backgroundColor: 'transparent'
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
                      )}
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
          messages={loaderMessages.length > 0 ? loaderMessages : undefined}
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

      {/* PDF outdated state - only show if user can edit and not generating */}
      {!isLocked && !error && isPdfOutdated && !isGenerating && (
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-center">
              <span className="font-semibold">⚠️ PDF desactualizado:</span> Has regenerado algunas imágenes. Finaliza el cuento nuevamente para actualizar el PDF.
            </p>
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