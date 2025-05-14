import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Character } from '../../types';
import CharacterCard from './CharacterCard';

interface CharactersGridProps {
  characters: Character[];
  onDeleteCharacter: (id: string) => void;
}

const CharactersGrid: React.FC<CharactersGridProps> = ({
  characters,
  onDeleteCharacter,
}) => {
  const navigate = useNavigate();

  const handleEdit = (id: string) => {
    navigate(`/nuevo-cuento/personaje/${id}/editar`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este personaje?')) {
      await onDeleteCharacter(id);
    }
  };

  return (
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
          onClick={() => navigate('/nuevo-cuento/personaje/nuevo')}
          className="h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors"
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
  );
};

export default CharactersGrid;