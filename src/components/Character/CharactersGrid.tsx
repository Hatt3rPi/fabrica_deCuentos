import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCharacterStore } from '../../stores/characterStore';
import { useAuth } from '../../context/AuthContext';
import CharacterCard from './CharacterCard';

const CharactersGrid: React.FC = () => {
  const navigate = useNavigate();
  const { supabase } = useAuth();
  const { characters, setCharacters, deleteCharacter } = useCharacterStore();

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

      setCharacters(data || []);
    };

    loadCharacters();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/nuevo-cuento/personaje/${id}/editar`);
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
    navigate('/nuevo-cuento/personaje/nuevo');
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>

        {characters.length < 3 && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleAddCharacter}
            className="h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors"
            aria-label="Añadir nuevo personaje"
          >
            <Plus className="w-12 h-12" />
            <span className="text-lg">Añadir personaje</span>
          </motion.button>
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

        {characters.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center text-gray-600"
          >
            Aún no has creado personajes
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default CharactersGrid;