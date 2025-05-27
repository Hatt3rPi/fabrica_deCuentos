import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Plus } from 'lucide-react'; // Add Plus
import { Character } from '../../types';

interface CharacterCardProps {
  character?: Character; // Make character optional
  onEdit?: (id: string) => void; // Make onEdit optional
  onDelete?: (id: string) => void; // Make onDelete optional
  onClick?: () => void; // Add generic onClick for the add card case or general card click
  isAddCard?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
  onClick,
  isAddCard,
}) => {
  if (isAddCard) {
    return (
      <motion.div
        layout
        onClick={onClick} // Use the generic onClick for the add card
        className="h-full min-h-[300px] md:min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-12 h-12" />
        <span className="text-lg">Añadir personaje</span>
      </motion.div>
    );
  }

  // Ensure character is defined for normal card rendering
  if (!character || !onEdit || !onDelete) {
    // This case should ideally not happen if isAddCard is false
    // Or handle it by returning null or a placeholder
    console.warn("CharacterCard rendered without character or handlers when not in isAddCard mode.");
    return null; 
  }

  const handleCardClick = () => {
    if (onEdit) {
      onEdit(character.id);
    }
  };
  
  const handleEditButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when button is clicked
    if (onEdit) {
      onEdit(character.id);
    }
  };

  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when button is clicked
    if (onDelete) {
      onDelete(character.id);
    }
  };


  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleCardClick} // Make the entire card clickable for editing
    >
      <div className="aspect-square relative">
        {character.thumbnail_url ? ( // Assuming DB field is thumbnail_url
          <img
            src={character.thumbnail_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm p-2 text-center">Sin imagen de miniatura</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate" title={character.name}>
          {character.name || "Personaje sin nombre"}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {character.age ? `${character.age} años` : "Edad no especificada"}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10"> {/* Fixed height for description area */}
          {typeof character.description === 'object'
            ? character.description.es || "Sin descripción"
            : character.description || "Sin descripción"}
        </p>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleEditButtonClick}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            aria-label={`Editar ${character.name}`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar</span>
          </button>
          <button
            onClick={handleDeleteButtonClick}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            aria-label={`Eliminar ${character.name}`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterCard;