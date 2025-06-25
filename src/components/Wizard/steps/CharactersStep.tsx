import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Lock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useWizard } from '../../../context/WizardContext';
import { useCharacterStore } from '../../../stores/characterStore';
import CharacterCard from '../../Character/CharacterCard';
import CharacterSelectionModal from '../../Modal/CharacterSelectionModal';
import { useWizardLockStatus } from '../../../hooks/useWizardLockStatus';

const CharactersStep: React.FC = () => {
  const { supabase } = useAuth();
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { characters, setCharacters } = useWizard();
  const { setCharacters: setStoreCharacters } = useCharacterStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    isStepLocked, 
    getLockReason, 
    isLoading, 
    error, 
    retry 
  } = useWizardLockStatus();
  
  const isLocked = isStepLocked('characters');
  const lockReason = getLockReason('characters');

  // DEBUG: Log para diagnosticar problema de candados
  React.useEffect(() => {
    console.log('[CharactersStep] DEBUG - Estado de candado:', {
      storyId,
      totalPages: generatedPages.length,
      pagesWithImages: generatedPages.filter(p => p.imageUrl && p.pageNumber > 0).length,
      hasGeneratedPages,
      isCharactersLocked,
      allPages: generatedPages.map(p => ({ 
        pageNumber: p.pageNumber, 
        hasImage: !!p.imageUrl,
        imageUrl: p.imageUrl?.substring(0, 30) + '...'
      }))
    });
  }, [generatedPages, hasGeneratedPages, isCharactersLocked, storyId]);

  useEffect(() => {
    loadStoryCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  useEffect(() => {
    if (characters.length === 0) {
      setIsModalOpen(true);
    }
  }, [characters]);

  // Mark that user has interacted with character selection when modal opens
  useEffect(() => {
    if (isModalOpen && storyId) {
      sessionStorage.setItem(`character_interaction_${storyId}`, 'true');
      console.log('[CharactersStep] User interacting with character selection for story:', storyId);
    }
  }, [isModalOpen, storyId]);

  const loadStoryCharacters = async () => {
    if (!storyId) return;

    const { data: links, error: linkError } = await supabase
      .from('story_characters')
      .select('character_id')
      .eq('story_id', storyId);

    if (linkError) {
      console.error('Error loading story characters:', linkError);
      return;
    }

    const ids = links?.map(l => l.character_id) || [];

    if (ids.length === 0) {
      setCharacters([]);
      setStoreCharacters([]);
      return;
    }

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading characters:', error);
      return;
    }

    const processed = (data || []).map(char => ({
      ...char,
      thumbnailUrl: char.thumbnail_url,
    }));

    setCharacters(processed);
    setStoreCharacters(processed);
  };

  const handleEdit = (id: string) => {
    sessionStorage.setItem('skipWizardCleanup', 'true');
    navigate(`/nuevo-cuento/personaje/${id}/editar`);
  };

  const handleDelete = async (id: string) => {
    if (!storyId) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este personaje del cuento?')) return;

    const { error } = await supabase
      .from('story_characters')
      .delete()
      .eq('story_id', storyId)
      .eq('character_id', id);

    if (error) {
      console.error('Error removing character from story:', error);
      return;
    }

    await loadStoryCharacters();
  };

  const handleCharacterAdded = async () => {
    await loadStoryCharacters();
    // Si ya hay 3 personajes, cerramos el modal automáticamente
    if (characters.length >= 2) { // 2 porque aún no se ha actualizado el estado
      setIsModalOpen(false);
    }
  };

  const handleAddCharacter = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">
            Personajes de tu Historia
          </h2>
          {isLocked && (
            <div className="flex items-center text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-lg">
              <Lock className="w-4 h-4 mr-1" />
              {lockReason}
            </div>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {isLocked 
            ? 'Los personajes no pueden modificarse'
            : 'Crea hasta 3 personajes para tu cuento'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {characters.map(character => (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={!isLocked ? handleEdit : undefined}
              onDelete={!isLocked ? handleDelete : undefined}
              isLocked={isLocked}
            />
          ))}
        </AnimatePresence>

        {characters.length < 3 && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => !isLocked && handleAddCharacter()}
            disabled={isLocked}
            className={`h-full min-h-[400px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${
              isLocked
                ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600'
            }`}
            aria-label="Añadir nuevo personaje"
          >
            {isLocked ? (
              <>
                <Lock className="w-12 h-12" />
                <span className="text-lg">Personajes bloqueados</span>
              </>
            ) : (
              <>
                <Plus className="w-12 h-12" />
                <span className="text-lg">Añadir personaje</span>
              </>
            )}
          </motion.button>
        )}

      </div>
      <CharacterSelectionModal
        isOpen={isModalOpen}
        storyId={storyId!}
        onClose={() => setIsModalOpen(false)}
        onCharacterAdded={handleCharacterAdded}
      />
    </div>
  );
};

export default CharactersStep;
