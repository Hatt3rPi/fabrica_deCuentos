import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Loader, Trash2, Edit } from 'lucide-react';
import { Character } from '../../types';
import Button from '../UI/Button';

interface ModalPersonajesProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalPersonajes: React.FC<ModalPersonajesProps> = ({ isOpen, onClose }) => {
  const { supabase, user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadCharacters();
    }
  }, [isOpen]);

  const loadCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCharacter = (characterId: string) => {
    setSelectedCharacters(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  const handleCreateCharacter = async () => {
    try {
      // Create new story draft if none exists
      if (!currentStoryId) {
        const { data: story, error: storyError } = await supabase
          .from('stories')
          .insert({
            user_id: user?.id,
            status: 'draft',
            title: 'Nuevo cuento'
          })
          .select()
          .single();

        if (storyError) throw storyError;
        setCurrentStoryId(story.id);
      }

      onClose();
      navigate(`/wizard/${currentStoryId}/characters/new`);
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const handleEditCharacter = (characterId: string) => {
    onClose();
    navigate(`/nuevo-cuento/personaje/${characterId}/editar`);
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este personaje?')) return;

    setIsDeleting(characterId);
    try {
      // Delete character images from storage
      const character = characters.find(c => c.id === characterId);
      if (character?.reference_urls?.length) {
        for (const url of character.reference_urls) {
          const path = url.split('/').pop();
          if (path) {
            await supabase.storage
              .from('characters')
              .remove([`reference-images/${characterId}/${path}`]);
          }
        }
      }

      // Delete character from database
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      // Update local state
      setCharacters(prev => prev.filter(c => c.id !== characterId));
      setSelectedCharacters(prev => prev.filter(id => id !== characterId));
    } catch (error) {
      console.error('Error deleting character:', error);
      alert('Error al eliminar el personaje');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleContinue = async () => {
    if (selectedCharacters.length === 0) return;

    try {
      // Create new story draft
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user?.id,
          status: 'draft',
          title: 'Nuevo cuento'
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // Link selected characters to story
      const { error: linkError } = await supabase
        .from('story_characters')
        .insert(
          selectedCharacters.map(characterId => ({
            story_id: story.id,
            character_id: characterId
          }))
        );

      if (linkError) throw linkError;

      onClose();
      navigate(`/wizard/${story.id}`);
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[560px] max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Selecciona los personajes
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className={`relative cursor-pointer group ${
                    selectedCharacters.includes(character.id)
                      ? 'ring-2 ring-purple-500'
                      : ''
                  }`}
                >
                  <div 
                    onClick={() => toggleCharacter(character.id)}
                    className="aspect-square rounded-lg overflow-hidden"
                  >
                    <img
                      src={character.thumbnailUrl || 'https://images.pexels.com/photos/1314550/pexels-photo-1314550.jpeg'}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Character actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCharacter(character.id)}
                      className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4 text-purple-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteCharacter(character.id)}
                      disabled={isDeleting === character.id}
                      className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                    >
                      {isDeleting === character.id ? (
                        <Loader className="w-4 h-4 text-red-600 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>

                  {selectedCharacters.includes(character.id) && (
                    <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-center text-gray-700 truncate">
                    {character.name}
                  </p>
                </div>
              ))}
              <button
                onClick={handleCreateCharacter}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors"
              >
                <Plus className="w-8 h-8" />
                <span className="text-sm">Crear nuevo</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <Button
            onClick={handleContinue}
            disabled={selectedCharacters.length === 0}
            className="w-full"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalPersonajes;