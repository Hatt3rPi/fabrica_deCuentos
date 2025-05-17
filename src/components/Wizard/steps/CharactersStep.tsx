import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Character } from '../../../types';
import CharacterCard from '../../Character/CharacterCard';

const CharactersStep: React.FC = () => {
  const navigate = useNavigate();
  const { storyId } = useParams();
  const { supabase, user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const { data: storyCharacters, error: storyError } = await supabase
        .from('story_characters')
        .select('character_id')
        .eq('story_id', storyId);

      if (storyError) throw storyError;

      const characterIds = storyCharacters?.map(sc => sc.character_id) || [];

      if (characterIds.length > 0) {
        const { data: charactersData, error: charactersError } = await supabase
          .from('characters')
          .select('*')
          .in('id', characterIds);

        if (charactersError) throw charactersError;
        setCharacters(charactersData || []);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      setError('Error al cargar los personajes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCharacter = () => {
    navigate(`/wizard/${storyId}/characters/new`);
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      await supabase
        .from('story_characters')
        .delete()
        .eq('story_id', storyId)
        .eq('character_id', characterId);

      setCharacters(prev => prev.filter(c => c.id !== characterId));
    } catch (error) {
      console.error('Error deleting character:', error);
      setError('Error al eliminar el personaje');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Personajes de tu Historia
        </h2>
        <p className="text-gray-600">
          Crea hasta 3 personajes para tu cuento
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {characters.map((character) => (
            <motion.div
              key={character.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CharacterCard
                character={character}
                onEdit={() => navigate(`/wizard/${storyId}/characters/${character.id}/edit`)}
                onDelete={() => handleDeleteCharacter(character.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {characters.length < 3 && (
          <motion.button
            layout
            onClick={handleAddCharacter}
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span>Añadir personaje</span>
          </motion.button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CharactersStep