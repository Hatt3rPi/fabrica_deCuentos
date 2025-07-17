import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Lock, Settings } from 'lucide-react';
import { useState } from 'react';
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
  /**
   * Additional CSS classes for the card container
   */
  className?: string;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
  showActions = true,
  showDescription = true,
  onClick,
  isSelected,
  isLocked = false,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      data-testid={`character-card-${character.id}`}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${onClick ? 'cursor-pointer' : ''} group ${className}`}
    >
      <div className="aspect-square relative">
        {character.thumbnailUrl ? (
          <img
            src={character.thumbnailUrl}
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">Sin imagen</span>
          </div>
        )}

        {/* Nombre y edad siempre visibles */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{character.name}</h3>
          <p className="text-sm text-gray-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{character.age} años</p>
        </div>

        {/* Menú de tuerca */}
        {showActions && !isLocked && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 rounded-full bg-black/30 text-white/80 hover:bg-black/50 hover:text-white transition-all"
              aria-label="Opciones del personaje"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Menú desplegable */}
            {isMenuOpen && (
              <div 
                className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(character.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4 text-purple-600" />
                    <span>Editar personaje</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(character.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Eliminar personaje</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Estado de bloqueado */}
        {isLocked && (
          <div className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white">
            <Lock className="w-4 h-4" />
          </div>
        )}

        {/* Indicador de selección */}
        {isSelected && (
          <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm">✓</div>
          </div>
        )}
      </div>

      {/* Descripción (opcional) */}
      {showDescription && (
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {typeof character.description === 'object'
              ? character.description.es
              : character.description || 'Sin descripción'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default CharacterCard;
