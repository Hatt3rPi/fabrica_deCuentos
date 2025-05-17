import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Loader, Trash2, Edit } from 'lucide-react';
import { Character } from '../../types';
import Button from '../UI/Button';

const DEFAULT_TARGET_AGE = '6-8';
const DEFAULT_LITERARY_STYLE = 'narrativo';
const DEFAULT_CENTRAL_MESSAGE = 'amistad';

interface ModalPersonajesProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalPersonajes: React.FC<ModalPersonajesProps> = ({ isOpen, onClose }) => {
  const { supabase, user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreateNew = async () => {
    if (!user) return;
    setIsCreating(true);

    try {
      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          status: 'draft',
          title: 'Nuevo cuento',
          target_age: DEFAULT_TARGET_AGE,
          literary_style: DEFAULT_LITERARY_STYLE,
          central_message: DEFAULT_CENTRAL_MESSAGE
        })
        .select()
        .single();

      if (error) throw error;
      
      onClose();
      navigate(`/wizard/${story.id}/characters/new`);
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCharacter = (characterId: string) => {
    setSelectedCharacters(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  const handleContinue = async () => {
    if (selectedCharacters.length === 0) return;

    try {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user?.id,
          status: 'draft',
          title: 'Nuevo cuento',
          target_age: DEFAULT_TARGET_AGE,
          literary_style: DEFAULT_LITERARY_STYLE,
          central_message: DEFAULT_CENTRAL_MESSAGE
        })
        .select()
        .single();

      if (storyError) throw storyError;

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
                onClick={handleCreateNew}
                disabled={isCreating}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Loader className="w-8 h-8 animate-spin" />
                    <span className="text-sm">Creando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-8 h-8" />
                    <span className="text-sm">Crear nuevo</span>
                  </>
                )}
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