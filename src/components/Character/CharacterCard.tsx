import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Lock } from 'lucide-react';
import { Character } from '../../types';

interface CharacterCardProps {
  character: Character;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  /**
   * When true the action buttons will only display the icon without text.
   */
  actionsIconOnly?: boolean;
  /**
   * Controls whether the character description is shown.
   * Defaults to true for backwards compatibility.
   */
  showDescription?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  /**
   * When true, the character card shows as locked and actions are disabled.
   */
  isLocked?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
  showActions = true,
  actionsIconOnly = false,
  showDescription = true,
  onClick,
  isSelected,
  isLocked = false,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="aspect-square relative">
        {character.thumbnailUrl ? (
          <img
            src={character.thumbnailUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">Sin imagen</span>
          </div>
        )}
        {isSelected && (
          <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm">✓</div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          {character.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{character.age} años</p>
        {showDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
            {typeof character.description === 'object'
              ? character.description.es
              : character.description}
          </p>
        )}

        {showActions && (
          <div className="flex gap-2">
            {isLocked ? (
              <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-400 bg-gray-50 rounded-md">
                <Lock className="w-4 h-4" />
                {!actionsIconOnly && <span>Bloqueado</span>}
              </div>
            ) : (
              <>
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(character.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                    aria-label="Editar personaje"
                  >
                    <Edit2 className="w-4 h-4" />
                    {!actionsIconOnly && <span>Editar</span>}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(character.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    aria-label="Eliminar personaje"
                  >
                    <Trash2 className="w-4 h-4" />
                    {!actionsIconOnly && <span>Eliminar</span>}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CharacterCard;
