import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, Download, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStoryReader } from '../hooks/useStoryReader';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { usePdfExport } from '../hooks/usePdfExport';
import { useStoryStyles } from '../hooks/useStoryStyles';

const StoryReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supabase, user } = useAuth();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Custom hooks
  const { story, pages, loading, error } = useStoryReader(id);
  const { downloadPdf, downloading: downloadingPdf } = usePdfExport();
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

  // Get styles for current page
  const textStyles = getTextStyles(currentPageIndex);
  const containerStyles = getContainerStyles(currentPageIndex);
  const position = getPosition(currentPageIndex);
  const backgroundImage = getBackgroundImage(currentPageIndex, currentPage?.image_url);

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
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Página {currentPageIndex + 1} de {pages.length}
            </span>
            <button
              onClick={() => story && downloadPdf(story)}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloadingPdf ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full mx-auto">
          <div className="relative">
            {/* Story page display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div 
                className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 relative bg-cover bg-center"
                style={{
                  backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined
                }}
              >
                {/* Text overlay with dynamic positioning */}
                <div 
                  className={`absolute inset-0 flex ${
                    position === 'top' ? 'items-start pt-8' :
                    position === 'center' ? 'items-center' :
                    'items-end pb-8'
                  } justify-center px-6`}
                >
                  <div 
                    style={{
                      ...containerStyles,
                      ...(styleConfig && currentPageIndex > 0 && styleConfig.pageConfig.text.containerStyle.gradientOverlay
                        ? { background: styleConfig.pageConfig.text.containerStyle.gradientOverlay }
                        : {}
                      ),
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
                        width: '100%'
                      }}
                    >
                      {renderPageText()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={goToPreviousPage}
              disabled={isFirstPage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={goToNextPage}
              disabled={isLastPage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile navigation buttons */}
          <div className="flex justify-between mt-6 sm:hidden">
            <button
              onClick={goToPreviousPage}
              disabled={isFirstPage}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={goToNextPage}
              disabled={isLastPage}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Keyboard hints */}
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Usa las flechas ← → para navegar • Presiona Esc para volver</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryReader;