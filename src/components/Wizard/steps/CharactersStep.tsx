import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Plus } from 'lucide-react';
import { Character } from '../../../types';
import CharacterCard from '../../Character/CharacterCard';
import CharacterForm from '../../Character/CharacterForm';
import Modal from '../../UI/Modal';

const CharactersStep: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const { supabase } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (storyId) {
      loadCharacters();
    }
  }, [storyId]);

  const loadCharacters = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('story_characters')
        .select('character_id, characters(*)')
        .eq('story_id', storyId);
      
      if (error) throw error;
      setCharacters(data?.map(d => d.characters) || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCharacterId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingCharacterId(id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este personaje?')) return;
    
    try {
      await supabase
        .from('story_characters')
        .delete()
        .eq('story_id', storyId)
        .eq('character_id', id);
      
      await loadCharacters();
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const handleSave = async (savedCharacter: Character) => {
    if (!editingCharacterId) {
      await supabase
        .from('story_characters')
        .insert({ story_id: storyId, character_id: savedCharacter.id });
    }
    await loadCharacters();
    setIsFormOpen(false);
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando personajes...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Personajes de tu historia</h2>
        <p className="text-gray-600">
          Crea hasta 3 personajes para tu cuento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        
        {characters.length < 3 && (
          <div
            onClick={handleAdd}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors cursor-pointer"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm">Crear personaje</span>
          </div>
        )}
      </div>

      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingCharacterId ? "Editar personaje" : "Crear personaje"}
        >
          <CharacterForm
            characterId={editingCharacterId}
            storyId={storyId!}
            onSave={handleSave}
          />
        </Modal>
      )}
    </div>
  );
};

export default CharactersStep;
