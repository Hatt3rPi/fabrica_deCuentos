import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Check, Plus } from 'lucide-react';
import { Character } from '../../types';

interface CharacterCardProps {
  character: Character;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-lg shadow-md overflow-hidden ${isSelected ? 'border-2 border-purple-600' : ''}`}
    >
      <div className="aspect-square relative">
        {character.thumbnailUrl ? (
          <img
            src={character.thumbnailUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">Sin imagen</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {character.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {character.age} años
        </p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {typeof character.description === 'object'
            ? character.description.es
            : character.description}
        </p>

        <div className="flex gap-2">
          {onSelect && (
            <button
              onClick={onSelect}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${
                isSelected
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'text-purple-600 hover:bg-purple-50'
              } rounded-md transition-colors`}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Seleccionado</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Seleccionar</span>
                </>
              )}
            </button>
          )}
          {!onSelect && (
            <>
              <button
                onClick={() => onEdit(character.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => onDelete(character.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterCard;