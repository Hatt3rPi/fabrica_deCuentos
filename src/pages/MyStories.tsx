import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, PenTool, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { storyService } from '../services/storyService';
import { useNavigate, useLocation } from 'react-router-dom';
import StoryCard from '../components/StoryCard';
import { EstadoFlujo } from '../types';
import { initialFlowState } from '../stores/wizardFlowStore';
import type { WizardStep } from '../context/WizardContext';
import { logger } from '../utils/logger';

interface Story {
  id: string;
  title: string;
  created_at: string;
  status: 'draft' | 'completed';
  cover_url: string;
}

const MyStories: React.FC = () => {
  const { supabase, user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [deleteCharacters, setDeleteCharacters] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<{completed: number, drafts: number}>({completed: 1, drafts: 1});
  // Número de cuentos por página según el tamaño de la pantalla
  const [storiesPerPage, setStoriesPerPage] = useState<number>(8); // Valor por defecto, se actualizará en el efecto
  
  // Ajustar el número de cuentos por página según el ancho de la pantalla
  useEffect(() => {
    const updateStoriesPerPage = () => {
      if (window.innerWidth >= 1280) { // desktop (xl)
        setStoriesPerPage(12); // 6 columnas x 2 filas = 12 cuentos
      } else if (window.innerWidth >= 768) { // tablet (md)
        setStoriesPerPage(8); // 4 columnas x 2 filas = 8 cuentos
      } else { // móvil
        setStoriesPerPage(4); // 2 columnas x 2 filas = 4 cuentos
      }
    };
    
    // Actualizar al montar
    updateStoriesPerPage();
    
    // Actualizar al cambiar el tamaño de la ventana
    window.addEventListener('resize', updateStoriesPerPage);
    
    // Limpiar el event listener al desmontar
    return () => window.removeEventListener('resize', updateStoriesPerPage);
  }, []);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadStories();
  }, []);

  // Reload stories when user returns to the page (e.g., from wizard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is now visible, reload stories to get latest data
        loadStories();
      }
    };

    const handleFocus = () => {
      // Window regained focus, reload stories
      loadStories();
    };

    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Listen for window focus (returning from other window)
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Reload stories when navigating back to home (e.g., from wizard)
  useEffect(() => {
    // Check if we just navigated to /home (reload to get fresh data)
    if (location.pathname === '/home') {
      loadStories();
    }
  }, [location.pathname]);

  // Optional: Soft polling for real-time updates when page is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      // Poll every 30 seconds when page is visible and focused
      interval = setInterval(() => {
        if (!document.hidden && document.hasFocus()) {
          loadStories();
        }
      }, 30000); // 30 seconds
    };

    startPolling();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ids = (data || []).map((s) => s.id);
      const covers: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: pages } = await supabase
          .from('story_pages')
          .select('story_id,image_url')
          .in('story_id', ids)
          .eq('page_number', 0);
        (pages || []).forEach((p) => {
          covers[p.story_id] = p.image_url;
        });
      }

      setStories(
        (data || []).map((s) => ({ ...s, cover_url: covers[s.id] || '' })) as Story[]
      );
    } catch (error) {
      logger.error('Error loading stories:', error);
    }
  };

  const handleNewStory = async () => {
    logger.debug('Iniciando creación de historia');
    
    try {
      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          user_id: user?.id,
          status: 'draft',
          title: 'Nuevo cuento',
          wizard_state: initialFlowState
        })
        .select()
        .single();

      if (error) throw error;

      logger.debug('Historia creada, navegando a wizard');
      navigate(`/wizard/${story.id}`);
    } catch (error) {
      logger.error('Error creating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear la historia';
      alert('Error al crear la historia: ' + errorMessage);
    }
  };

  const stepFromEstado = (estado: EstadoFlujo): WizardStep => {
    if (estado.personajes.estado !== 'completado') return 'characters';
    if (estado.cuento !== 'completado') return 'story';
    if (estado.diseno !== 'completado') return 'design';
    return 'preview';
  };

  const handleContinueStory = (storyId: string) => {
    (async () => {
      let draft: any = null;
      try {
        draft = await storyService.getStoryDraft(storyId);
      } catch (error) {
        console.error('Error preloading draft:', error);
      }

      const flow: EstadoFlujo =
        draft?.story?.wizard_state || {
          personajes: { estado: 'no_iniciada', personajesAsignados: 0 },
          cuento: 'no_iniciada',
          diseno: 'no_iniciada',
          vistaPrevia: 'no_iniciada'
        };

      const step = stepFromEstado(flow);

      console.log('[Home] wizard_state', { storyId, wizard_state: flow });

      console.log('[Home] continuar', {
        storyId,
        irA: step,
        campos: {
          personajes: draft?.characters?.length || 0,
          cuento: draft?.pages?.length || draft?.generatedPages?.length || 0,
          diseno: draft?.design?.visual_style || null,
          vistaPrevia: draft?.pages?.length ? 'listo' : null
        }
      });

      navigate(`/wizard/${storyId}`);
    })();
  };

  const handleReadStory = (storyId: string) => {
    navigate(`/story/${storyId}/read`);
  };

  const handleDeleteClick = (story: Story) => {
    setStoryToDelete(story);
    setDeleteCharacters(true);
  };

  const confirmDelete = async () => {
    if (!storyToDelete) return;
    setIsDeleting(true);
    try {
      if (deleteCharacters) {
        await storyService.deleteStoryWithCharacters(storyToDelete.id);
      } else {
        await storyService.deleteStoryOnly(storyToDelete.id);
      }
      setStories(prev => prev.filter(s => s.id !== storyToDelete.id));
      alert('Cuento eliminado correctamente');
    } catch (err) {
      logger.error('Error deleting story:', err);
      alert('Error al eliminar el cuento');
    } finally {
      setIsDeleting(false);
      setStoryToDelete(null);
    }
  };

  const cancelDelete = () => setStoryToDelete(null);

  // Agrupar cuentos por estado y manejar paginación
  const { completedStories, draftStories, paginatedCompleted, paginatedDrafts, totalCompletedPages, totalDraftPages } = useMemo(() => {
    const completed = stories.filter(story => story.status === 'completed');
    const drafts = stories.filter(story => story.status === 'draft');
    
    // Calcular páginas
    const totalCompletedPages = Math.ceil(completed.length / storiesPerPage);
    const totalDraftPages = Math.ceil(drafts.length / storiesPerPage);
    
    // Asegurar que la página actual no sea mayor que el total de páginas
    const currentCompletedPage = Math.min(currentPage.completed, Math.max(1, totalCompletedPages || 1));
    const currentDraftPage = Math.min(currentPage.drafts, Math.max(1, totalDraftPages || 1));
    
    // Obtener cuentos para la página actual
    const indexOfLastCompleted = currentCompletedPage * storiesPerPage;
    const indexOfFirstCompleted = indexOfLastCompleted - storiesPerPage;
    const paginatedCompleted = completed.slice(indexOfFirstCompleted, indexOfLastCompleted);
    
    const indexOfLastDraft = currentDraftPage * storiesPerPage;
    const indexOfFirstDraft = indexOfLastDraft - storiesPerPage;
    const paginatedDrafts = drafts.slice(indexOfFirstDraft, indexOfLastDraft);
    
    // Actualizar el estado de la página si es necesario
    if (currentCompletedPage !== currentPage.completed || currentDraftPage !== currentPage.drafts) {
      setCurrentPage({
        completed: currentCompletedPage,
        drafts: currentDraftPage
      });
    }
    
    return {
      completedStories: completed,
      draftStories: drafts,
      paginatedCompleted,
      paginatedDrafts,
      totalCompletedPages: totalCompletedPages || 1,
      totalDraftPages: totalDraftPages || 1
    };
  }, [stories, currentPage, storiesPerPage]);
  
  // Cambiar página
  const paginate = (type: 'completed' | 'drafts', pageNumber: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [type]: pageNumber
    }));
    // Desplazarse al inicio de la sección
    const sectionId = type === 'completed' ? 'completed-stories' : 'draft-stories';
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 mb-3">
            Mis Cuentos
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Aquí encontrarás todos tus cuentos creados, tanto los completados como los que están en progreso.
          </p>
        </div>

        {/* Sección de Cuentos Completados */}
        {completedStories.length > 0 && (
          <div id="completed-stories" className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Cuentos Completados
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Disfruta de tus historias finalizadas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
                  {completedStories.length} {completedStories.length === 1 ? 'cuento' : 'cuentos'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {paginatedCompleted.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onContinue={handleContinueStory}
                  onRead={handleReadStory}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
            {/* Paginación */}
            {totalCompletedPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="flex items-center gap-1" aria-label="Paginación de cuentos completados">
                  <button
                    onClick={() => paginate('completed', currentPage.completed - 1)}
                    disabled={currentPage.completed === 1}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalCompletedPages) }, (_, i) => {
                    // Mostrar máximo 5 páginas en la navegación
                    let pageNum;
                    if (totalCompletedPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage.completed <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage.completed >= totalCompletedPages - 2) {
                      pageNum = totalCompletedPages - 4 + i;
                    } else {
                      pageNum = currentPage.completed - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate('completed', pageNum)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          currentPage.completed === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        aria-current={currentPage.completed === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate('completed', currentPage.completed + 1)}
                    disabled={currentPage.completed === totalCompletedPages}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}

        {/* Sección de Borradores */}
        {draftStories.length > 0 && (
          <div id="draft-stories" className="mt-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <PenTool className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    En Progreso
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Continúa creando tus historias
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium border border-amber-200 dark:border-amber-800">
                  {draftStories.length} {draftStories.length === 1 ? 'borrador' : 'borradores'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {paginatedDrafts.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onContinue={handleContinueStory}
                  onRead={handleReadStory}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
            {/* Paginación */}
            {totalDraftPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="flex items-center gap-1" aria-label="Paginación de borradores">
                  <button
                    onClick={() => paginate('drafts', currentPage.drafts - 1)}
                    disabled={currentPage.drafts === 1}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalDraftPages) }, (_, i) => {
                    // Mostrar máximo 5 páginas en la navegación
                    let pageNum;
                    if (totalDraftPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage.drafts <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage.drafts >= totalDraftPages - 2) {
                      pageNum = totalDraftPages - 4 + i;
                    } else {
                      pageNum = currentPage.drafts - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate('drafts', pageNum)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          currentPage.drafts === pageNum
                            ? 'bg-amber-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        aria-current={currentPage.drafts === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate('drafts', currentPage.drafts + 1)}
                    disabled={currentPage.drafts === totalDraftPages}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}

        {/* Mensaje cuando no hay cuentos */}
        {stories.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="absolute -top-2 -left-2 w-24 h-24 bg-purple-200 dark:bg-purple-900/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-blue-200 dark:bg-blue-900/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="relative z-10">
                <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              ¡Comienza tu aventura literaria!
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Aún no has creado ningún cuento. Da el primer paso para dar vida a historias increíbles.
            </p>
            <button
              onClick={handleNewStory}
              className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 ease-out shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out"></span>
              <Plus className="relative w-5 h-5 mr-2 group-hover:animate-bounce" />
              <span className="relative font-semibold">Crear mi primer cuento</span>
            </button>
          </div>
        )}

      {/* Botón flotante solo se muestra cuando hay cuentos existentes */}
      {stories.length > 0 && (
        <div className="fixed bottom-6 right-6 z-10">
          <button
            onClick={handleNewStory}
            className="group relative inline-flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:from-purple-700 hover:to-indigo-700 transform hover:-translate-y-1"
            aria-label="Crear nuevo cuento"
          >
            <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
            <span className="absolute opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap -top-10 left-1/2 transform -translate-x-1/2 transition-opacity duration-200">
              Nuevo cuento
              <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
                <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
              </svg>
            </span>
          </button>
        </div>
      )}
      <ConfirmDialog
        isOpen={storyToDelete !== null}
        title="Eliminar cuento"
        message="¿Estás seguro de que deseas eliminar este cuento?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      >
        <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
          <input
            type="checkbox"
            checked={deleteCharacters}
            onChange={e => setDeleteCharacters(e.target.checked)}
          />
          Eliminar personajes asociados
        </label>
      </ConfirmDialog>
    </div>

  </div>
);
};

export default MyStories;