import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { storyService } from '../services/storyService';
import { useNavigate } from 'react-router-dom';

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

  const handleContinueStory = (storyId: string) => {
    navigate(`/wizard/${storyId}`);
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
            <div
              key={story.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <div className="aspect-video bg-gray-100">
                {story.cover_url ? (
                  <img
                    src={story.cover_url}
                    alt={story.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full animate-pulse bg-gray-200" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{story.title}</h3>
                  {story.status === 'draft' && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Borrador
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(story.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReadStory(story.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Leer</span>
                  </button>
                  {story.status === 'draft' && (
                    <button
                      onClick={() => handleContinueStory(story.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Continuar</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClick(story)}
                    className="flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
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