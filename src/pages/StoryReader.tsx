import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, Download, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStoryReader } from '../hooks/useStoryReader';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { usePdfExport } from '../hooks/usePdfExport';
import { useStoryStyles } from '../hooks/useStoryStyles';
import { useImageDimensions } from '../hooks/useImageDimensions';

const StoryReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supabase, user } = useAuth();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Custom hooks
  const { story, pages, loading, error } = useStoryReader(id);
  const { downloadPdf, regeneratePdf, downloading: downloadingPdf, regenerating } = usePdfExport();
  const { getTextStyles, getContainerStyles, getPosition, getBackgroundImage, styleConfig } = useStoryStyles();

  // Navigation callbacks with memoization
  const goToPreviousPage = useCallback(() => {
    setCurrentPageIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1));
  }, [pages.length]);

  const handleEscape = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  // Keyboard navigation
  useKeyboardNavigation({
    onNext: goToNextPage,
    onPrevious: goToPreviousPage,
    onEscape: handleEscape
  });

  // Memoized current page
  const currentPage = useMemo(() => {
    return pages[currentPageIndex];
  }, [pages, currentPageIndex]);

  // Memoized navigation state
  const { isFirstPage, isLastPage } = useMemo(() => ({
    isFirstPage: currentPageIndex === 0,
    isLastPage: currentPageIndex === pages.length - 1
  }), [currentPageIndex, pages.length]);

  // Get styles for current page
  const textStyles = getTextStyles(currentPageIndex);
  const containerStyles = getContainerStyles(currentPageIndex);
  const position = getPosition(currentPageIndex);
  const backgroundImage = getBackgroundImage(currentPageIndex, currentPage?.image_url);
  const imageDimensions = useImageDimensions(backgroundImage);

  // Memoized responsive font size calculation
  const responsiveFontSize = useMemo(() => {
    const baseFontSize = parseFloat(textStyles.fontSize as string || '16');
    return `clamp(${baseFontSize * 0.7}px, ${textStyles.fontSize}, ${baseFontSize * 1.2}px)`;
  }, [textStyles.fontSize]);

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Cargando cuento...</p>
        </div>
      </div>
    );
  }

  // Render error or empty state
  if (error || (!loading && (!story || pages.length === 0))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'No se pudo cargar el cuento'}</p>
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Safe text rendering with null check
  const renderPageText = () => {
    if (currentPageIndex === 0) {
      return story.title;
    }

    // Handle edge case where text might not exist
    if (!currentPage?.text) {
      return null;
    }

    return currentPage.text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < currentPage.text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header with navigation and controls */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{story.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              Página {currentPageIndex + 1} de {pages.length}
            </span>
            <button
              onClick={() => story && downloadPdf(story)}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloadingPdf ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>
            <button
              onClick={() => story && regeneratePdf(story)}
              disabled={regenerating || downloadingPdf}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Regenerar PDF"
            >
              {regenerating ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Regenerar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
          <div className="relative">
            {/* Story page display */}
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
                    <div 
                      style={{
                        ...textStyles,
                        width: '100%',
                        fontSize: responsiveFontSize,
                        lineHeight: textStyles.lineHeight || '1.4'
                      }}
                      className="text-center sm:text-left"
                    >
                      {renderPageText()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation arrows - Hidden on mobile, visible on tablet+ */}
            <button
              onClick={goToPreviousPage}
              disabled={isFirstPage}
              className="hidden sm:flex absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={goToNextPage}
              disabled={isLastPage}
              className="hidden sm:flex absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Mobile navigation and page counter */}
          <div className="sm:hidden space-y-4 mt-4">
            {/* Page counter for mobile */}
            <div className="text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {currentPageIndex + 1} de {pages.length}
              </span>
            </div>
            
            {/* Mobile navigation buttons */}
            <div className="flex justify-between">
              <button
                onClick={goToPreviousPage}
                disabled={isFirstPage}
                className="flex items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                onClick={goToNextPage}
                disabled={isLastPage}
                className="flex items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Keyboard hints - Only show on desktop */}
          <div className="hidden sm:block mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Usa las flechas ← → para navegar • Presiona Esc para volver</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryReader;