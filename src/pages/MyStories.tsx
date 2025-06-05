import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { storyService } from '../services/storyService';
import { useNavigate } from 'react-router-dom';
import StoryCard from '../components/StoryCard';
import { EstadoFlujo } from '../types';
import type { WizardStep } from '../context/WizardContext';

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

  useEffect(() => {
    loadStories();
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
      console.error('Error loading stories:', error);
    }
  };

  const handleNewStory = async () => {
    try {
      const { data: story, error } = await supabase
        .from('stories')
        .insert({ user_id: user?.id, status: 'draft', title: 'Nuevo cuento' })
        .select()
        .single();

      if (error) throw error;

      navigate(`/wizard/${story.id}`);
    } catch (err) {
      console.error('Error creating story:', err);
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
      let draft: unknown = null;
      const local = localStorage.getItem(`story_draft_${storyId}`);
      if (local) {
        draft = JSON.parse(local);
      } else {
        try {
          draft = await storyService.getStoryDraft(storyId);
        } catch (error) {
          console.error('Error preloading draft:', error);
        }
      }

      const data: any = draft;
      const flow: EstadoFlujo =
        data?.flow ||
        data?.story?.wizard_state || {
          personajes: { estado: 'no_iniciada', personajesAsignados: 0 },
          cuento: 'no_iniciada',
          diseno: 'no_iniciada',
          vistaPrevia: 'no_iniciada'
        };

      const step = stepFromEstado(flow);

      console.log('[Home] continuar', {
        storyId,
        irA: step,
        campos: {
          personajes: data?.characters?.length || data?.state?.characters?.length || 0,
          cuento: data?.generatedPages?.length || 0,
          diseno: data?.design?.visual_style || data?.designSettings?.visualStyle || null,
          vistaPrevia: data?.generatedPages?.length ? 'listo' : null
        }
      });

      navigate(`/wizard/${storyId}`);
    })();
  };

  const handleReadStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
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
      console.error('Error deleting story:', err);
      alert('Error al eliminar el cuento');
    } finally {
      setIsDeleting(false);
      setStoryToDelete(null);
    }
  };

  const cancelDelete = () => setStoryToDelete(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-800 mb-8">Mis Cuentos</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onContinue={handleContinueStory}
              onRead={handleReadStory}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>

      <button
        onClick={handleNewStory}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
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
        <label className="flex items-center gap-2 text-sm">
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