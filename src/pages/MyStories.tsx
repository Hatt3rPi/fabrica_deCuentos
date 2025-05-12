import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, Edit, Download, Loader } from 'lucide-react';
import ModalPersonajes from '../components/Modals/ModalPersonajes';

interface Story {
  id: string;
  title: string;
  created_at: string;
  status: 'draft' | 'done';
  cover_url: string;
}

const MyStories: React.FC = () => {
  const { supabase } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleContinueStory = (id: string) => {
    // TODO: Implement continue story logic
    console.log('Continue story:', id);
  };

  const handleDownloadStory = (id: string) => {
    // TODO: Implement download story logic
    console.log('Download story:', id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis Cuentos</h1>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No tienes cuentos aún
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer cuento mágico
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]"
              >
                <div className="aspect-square">
                  <img
                    src={story.cover_url || 'https://images.pexels.com/photos/1314550/pexels-photo-1314550.jpeg'}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{story.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(story.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {story.status === 'draft' && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Borrador
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {story.status === 'done' ? (
                      <button
                        onClick={() => handleDownloadStory(story.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleContinueStory(story.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Continuar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 flex items-center justify-center transition-transform hover:scale-110"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modal de selección de personajes */}
      <ModalPersonajes
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default MyStories;