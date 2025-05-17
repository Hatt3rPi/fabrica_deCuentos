import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Loader, Trash2, Edit } from 'lucide-react';
import { Character } from '../../types';
import Button from '../UI/Button';

interface ModalPersonajesProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalPersonajes: React.FC<ModalPersonajesProps> = ({ isOpen, onClose }) => {
  const { supabase, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateNew = async () => {
    try {
      // Create new story draft
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user?.id,
          status: 'draft',
          title: 'Nuevo cuento'
        })
        .select()
        .single();

      if (storyError) throw storyError;

      onClose();
      // Navigate directly to character creation form
      navigate(`/wizard/${story.id}/characters/new`);
    } catch (error) {
      console.error('Error creating story:', error);
      setError('Error al crear el cuento');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[560px] max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Crear nuevo cuento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <Button
            onClick={handleCreateNew}
            className="w-full"
          >
            <Plus className="w-5 h-5" />
            <span>Crear nuevo cuento</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalPersonajes;