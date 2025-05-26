import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, Pencil } from 'lucide-react';
import ModalPersonajes from '../components/Modals/ModalPersonajes';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewStory = async () => {
    try {
      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          user_id: user?.id,
          status: 'draft',
          title: 'Nuevo cuento'
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/wizard/${story.id}/personajes`);
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const handleContinueStory = (storyId: string) => {
    navigate(`/wizard/${storyId}`);
  };

  const handleReadStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

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
              <div className="aspect-square">
                <img
                  src={story.cover_url || 'https://images.pexels.com/photos/1148399/pexels-photo-1148399.jpeg'}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
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
      </div>

      <ModalPersonajes
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default MyStories;
