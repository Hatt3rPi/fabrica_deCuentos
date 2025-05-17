import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCharacterStore } from '../../stores/characterStore';
import { useAuth } from '../../context/AuthContext';
import CharacterCard from './CharacterCard';

const CharactersGrid: React.FC = () => {
  const navigate = useNavigate();
  const { supabase } = useAuth();
  const { characters, setCharacters, deleteCharacter } = useCharacterStore();
  const { storyId } = useParams<{ storyId: string }>();
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  useEffect(() => {
    const loadCharacters = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading characters:', error);
        return;
      }

      // Transform the data to match the Character type
      const transformedCharacters = data?.map(char => ({
        ...char,
        thumbnailUrl: char.thumbnail_url // Use the generated thumbnail
      })) || [];

      setCharacters(transformedCharacters);
    };

    loadCharacters();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/wizard/${storyId}/characters/new?id=${id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este personaje?')) {
      try {
        const { error } = await supabase
          .from('characters')
          .delete()
          .eq('id', id);

        if (error) throw error;
        deleteCharacter(id);
      } catch (error) {
        console.error('Error deleting character:', error);
      }
    }
  };

  const handleAddCharacter = () => {
    navigate(`/wizard/${storyId}/characters/new`);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Selecciona los personajes para tu historia
        </h2>
        <p className="text-gray-600">
          Puedes seleccionar hasta 3 personajes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isSelected={selectedCharacters.includes(character.id)}
              onSelect={() => {
                setSelectedCharacters(prev => 
                  prev.includes(character.id) 
                    ? prev.filter(id => id !== character.id)
                    : [...prev, character.id]
                );
              }}
            />
          ))}
        </AnimatePresence>

        {characters.length === 0 && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="col-span-full text-center text-gray-600"
            role="alert"
          >
            Aún no has creado personajes
          </motion.div>
        )}

        {characters.length >= 3 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center text-gray-600"
            role="alert"
          >
            Has alcanzado el máximo de personajes
          </motion.p>
        )}
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={async () => {
            if (selectedCharacters.length === 0) {
              alert('Debes seleccionar al menos un personaje');
              return;
            }

            try {
              // Insertar en story_characters
              const { error } = await supabase
                .from('story_characters')
                .insert(
                  selectedCharacters.map(characterId => ({
                    story_id: storyId,
                    character_id: characterId
                  }))
                );

              if (error) throw error;

              navigate(`/wizard/${storyId}`);
            } catch (error) {
              console.error('Error linking characters to story:', error);
              alert('Error al guardar los personajes');
            }
          }}
          className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          disabled={selectedCharacters.length === 0}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default CharactersGrid;