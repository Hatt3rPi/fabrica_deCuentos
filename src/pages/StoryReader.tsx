import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, Download, Loader } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../types/notification';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface StoryData {
  id: string;
  title: string;
  status: 'draft' | 'completed';
  export_url?: string;
}

interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  image_url: string;
}

const StoryReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
  const [story, setStory] = useState<StoryData | null>(null);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/home');
      return;
    }
    
    fetchStoryData();
  }, [id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPreviousPage();
      } else if (event.key === 'ArrowRight') {
        goToNextPage();
      } else if (event.key === 'Escape') {
        navigate('/home');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPageIndex, pages.length]);

  const fetchStoryData = async () => {
    try {
      setLoading(true);

      // Fetch story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('id, title, status, export_url')
        .eq('id', id)
        .single();

      if (storyError || !storyData) {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          'Cuento no encontrado',
          NotificationPriority.HIGH
        );
        navigate('/home');
        return;
      }

      // Only allow reading completed stories
      if (storyData.status !== 'completed') {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          'Solo se pueden leer cuentos completados',
          NotificationPriority.HIGH
        );
        navigate('/home');
        return;
      }

      setStory(storyData);

      // Fetch pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('story_pages')
        .select('id, page_number, text, image_url')
        .eq('story_id', id)
        .order('page_number');

      if (pagesError) {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          'Error cargando páginas del cuento',
          NotificationPriority.HIGH
        );
        return;
      }

      setPages(pagesData || []);
    } catch (error) {
      console.error('Error fetching story:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        'Error cargando el cuento',
        NotificationPriority.HIGH
      );
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousPage = () => {
    setCurrentPageIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1));
  };

  const handleDownloadPdf = async () => {
    if (!story?.export_url) {
      // If no export URL, generate PDF
      try {
        setDownloadingPdf(true);
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/story-export`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            story_id: id,
            save_to_library: true
          })
        });

        if (!response.ok) {
          throw new Error('Error generando PDF');
        }

        const data = await response.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
          createNotification(
            NotificationType.SYSTEM_UPDATE,
            'Éxito',
            'PDF descargado exitosamente',
            NotificationPriority.MEDIUM
          );
        }
      } catch (error) {
        console.error('Error downloading PDF:', error);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          'Error descargando PDF',
          NotificationPriority.HIGH
        );
      } finally {
        setDownloadingPdf(false);
      }
    } else {
      // Use existing export URL
      window.open(story.export_url, '_blank');
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Éxito',
        'PDF descargado exitosamente',
        NotificationPriority.MEDIUM
      );
    }
  };

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

  if (!story || pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No se pudo cargar el cuento</p>
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

  const currentPage = pages[currentPageIndex];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === pages.length - 1;

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
              onClick={handleDownloadPdf}
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
                  backgroundImage: currentPage.image_url ? `url(${currentPage.image_url})` : undefined
                }}
              >
                {/* Text overlay - positioned differently for cover (page 0) vs story pages */}
                {currentPage.page_number === 0 ? (
                  // Cover page - title centered
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-8 py-6 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg backdrop-blur-sm">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {story.title}
                      </h1>
                      {currentPage.text && (
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          {currentPage.text}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Story pages - text at bottom
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-6">
                    <div className="text-white text-lg md:text-xl leading-relaxed text-center font-medium">
                      {currentPage.text.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                          {line}
                          {index < currentPage.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
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