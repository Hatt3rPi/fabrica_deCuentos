import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, PenTool } from 'lucide-react';
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
    } catch (err) {
      logger.error('Error creating story:', err);
      alert('Error al crear la historia: ' + err.message);
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

  // Agrupar cuentos por estado
  const { completedStories, draftStories } = useMemo(() => {
    const completed = stories.filter(story => story.status === 'completed');
    const drafts = stories.filter(story => story.status === 'draft');
    return {
      completedStories: completed,
      draftStories: drafts
    };
  }, [stories]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300 mb-8">Mis Cuentos</h1>

        {/* Sección de Cuentos Completados */}
        {completedStories.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Cuentos Completados
              </h2>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                {completedStories.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onContinue={handleContinueStory}
                  onRead={handleReadStory}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sección de Borradores */}
        {draftStories.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <PenTool className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Cuentos en Borrador
              </h2>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium">
                {draftStories.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onContinue={handleContinueStory}
                  onRead={handleReadStory}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay cuentos */}
        {stories.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No tienes cuentos aún
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              ¡Comienza creando tu primer cuento mágico!
            </p>
            <button
              onClick={handleNewStory}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Crear mi primer cuento</span>
            </button>
          </div>
        )}

      <button
        onClick={handleNewStory}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-full shadow-lg hover:bg-purple-700 dark:hover:bg-purple-800 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Nuevo cuento</span>
      </button>
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