import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Character {
  id: string;
  name: string;
  selected_variant: string;
  variants: Array<{
    id: string;
    imageUrl: string;
  }>;
}

interface ModalPersonajesProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalPersonajes: React.FC<ModalPersonajesProps> = ({ isOpen, onClose }) => {
  const { supabase } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const toggleCharacter = (id: string) => {
    setSelectedCharacters(prev =>
      prev.includes(id)
        ? prev.filter(charId => charId !== id)
        : [...prev, id]
    );
  };

  const handleCreateNewCharacter = () => {
    onClose();
    navigate('/characters/new');
  };

  const handleContinue = () => {
    if (selectedCharacters.length > 0) {
      // TODO: Save selected characters to wizard state
      navigate('/wizard/story');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[560px] max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Selecciona los personajes
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {characters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => toggleCharacter(character.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedCharacters.includes(character.id)
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className="aspect-square">
                    {character.selected_variant ? (
                      <img
                        src={character.variants.find(v => v.id === character.selected_variant)?.imageUrl}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">Sin imagen</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">
                      {character.name}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Tarjeta "Crear nuevo personaje" */}
              <div
                onClick={handleCreateNewCharacter}
                className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-300 transition-colors"
              >
                <div className="aspect-square flex flex-col items-center justify-center text-gray-400 hover:text-purple-500">
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-sm text-center px-2">
                    Crear personaje nuevo
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleContinue}
            disabled={selectedCharacters.length === 0}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPersonajes;