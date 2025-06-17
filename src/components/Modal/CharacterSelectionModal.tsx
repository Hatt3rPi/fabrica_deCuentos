import React, { useState, useEffect } from 'react';
import { Plus, X, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Character } from '../../types';
import CharacterCard from '../Character/CharacterCard';
import CharacterForm from '../Character/CharacterForm';

interface CharacterSelectionModalProps {
  isOpen: boolean;
  storyId: string;
  onClose: () => void;
  onCharacterAdded: () => void;
}

const CharacterSelectionModal: React.FC<CharacterSelectionModalProps> = ({
  isOpen,
  storyId,
  onClose,
  onCharacterAdded
}) => {
  const { supabase } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !showForm) {
      loadCharacters();
    }
  }, [isOpen, showForm]);

  const loadCharacters = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      const processed = (data || []).map(c => ({
        ...c,
        thumbnailUrl: c.thumbnail_url
      }));
      setCharacters(processed);
    }
    setIsLoading(false);
  };

  const [isLinking, setIsLinking] = useState<string | null>(null);

  const linkCharacter = async (characterId: string) => {
    if (isLinking) return false; // Prevent multiple simultaneous requests
    
    setIsLinking(characterId);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Linking character:', { storyId, characterId, userId: user.id });

      // Usar función segura de base de datos que maneja duplicados
      const { error } = await supabase.rpc('link_character_to_story', {
        p_story_id: storyId,
        p_character_id: characterId,
        p_user_id: user.id
      });

      if (error) {
        console.error('Error al asociar personaje:', error);
        throw error;
      }

      console.log('Character linked successfully');

      // Notificar éxito
      onCharacterAdded();
      onClose();
      return true;
      
    } catch (error) {
      console.error('Error al asociar personaje:', error);
      alert('No se pudo asociar el personaje. Por favor, inténtalo de nuevo.');
      return false;
    } finally {
      setIsLinking(null);
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (characterId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este personaje?')) return;

    try {
      const character = characters.find(c => c.id === characterId);
      // Verificamos si el personaje tiene imágenes de referencia
      const referenceUrls = (character as any)?.reference_urls || [];
      if (referenceUrls.length > 0) {
        for (const url of referenceUrls) {
          if (typeof url === 'string') {
            const path = url.split('/').pop();
            if (path) {
              await supabase.storage
                .from('storage')
                .remove([`reference-images/${characterId}/${path}`]);
            }
          }
        }
      }

      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      setCharacters(prev => prev.filter(c => c.id !== characterId));
    } catch (error) {
      console.error('Error deleting character:', error);
      alert('Error al eliminar el personaje');
    } finally {
      /* empty */
    }
  };

  const handleSave = async (id: string) => {
    setShowForm(false);
    if (editingId) {
      setEditingId(null);
      await loadCharacters();
      onCharacterAdded();
    } else {
      // Si es un nuevo personaje, lo vinculamos automáticamente
      await linkCharacter(id);
      // No cerramos el modal aquí para permitir agregar más personajes
      // El usuario puede cerrarlo manualmente o se cerrará al alcanzar el límite
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {showForm ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-[600px] overflow-auto max-h-[90vh]">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{editingId ? 'Editar personaje' : 'Nuevo personaje'}</h2>
            <button onClick={() => { setEditingId(null); setShowForm(false); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <CharacterForm id={editingId || undefined} onSave={handleSave} onCancel={() => { setEditingId(null); setShowForm(false); }} />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-[560px] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Selecciona un personaje</h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
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
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setShowForm(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                  aria-label="Crear nuevo personaje"
                >
                  <Plus className="w-8 h-8" />
                  <span className="text-sm">Crear nuevo</span>
                </motion.button>
                {characters.map((character) => (
                  <div key={character.id} className="relative">
                    <CharacterCard
                      character={character}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onClick={() => linkCharacter(character.id)}
                      isSelected={false}
                      showDescription={false}
                      actionsIconOnly
                    />
                    {isLinking === character.id && (
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                        <Loader className="w-6 h-6 text-purple-600 animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSelectionModal;
