import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWizard } from '../../../context/WizardContext';
import { useAuth } from '../../../context/AuthContext';
import { Plus } from 'lucide-react';
import { Character } from '../../../types';
import CharacterCard from '../../Character/CharacterCard';
import Modal from '../../UI/Modal';
import CharacterForm from '../../Character/CharacterForm';
// Removed duplicate import { useWizard } from '../../../context/WizardContext';

const CharactersStep: React.FC = () => {
  const { characters: wizardCharactersGlobal, setCharacters: setWizardCharacters, setStepStatus, currentStep } = useWizard(); // Destructure setStepStatus and currentStep
  const { supabase } = useAuth();
  const { storyId } = useParams<{ storyId: string }>();

  const [characters, setCharacters] = useState<Character[]>([]); // This is the local list of characters for this story
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect for validation logic
  useEffect(() => {
    if (characters) { // Check if characters array is available
      let isStepValid = false;
      if (characters.length > 0) {
        isStepValid = characters.some(char => {
          const hasName = char.name && char.name.trim() !== '';
          
          let hasDescription = false;
          if (typeof char.description === 'string') {
            hasDescription = char.description.trim() !== '';
          } else if (char.description && typeof char.description.es === 'string') {
            hasDescription = char.description.es.trim() !== '';
          }
          
          // Assuming the field is thumbnail_url based on previous Character type usage
          const hasImage = char.thumbnail_url && char.thumbnail_url.trim() !== ''; 
          
          return hasName && hasDescription && hasImage;
        });
      }
      // Ensure setStepStatus is called with the current step index from context
      // currentStep should be the index (e.g., 0, 1, 2...)
      if (typeof currentStep === 'number') { // currentStep might be string if using slugs, ensure it's number
        setStepStatus(currentStep, isStepValid);
      } else {
        // If currentStep is a slug (e.g. 'personajes'), WizardContext needs to handle mapping this slug to an index
        // For now, assuming currentStep from useWizard() is the step *name* or *slug* if not an index
        // This part depends on how WizardContext and WizardNav are implemented.
        // Let's assume WizardContext's setStepStatus can handle a string key for the step.
        setStepStatus('personajes', isStepValid); // Using 'personajes' as key for this step
      }
    }
  }, [characters, currentStep, setStepStatus]);


  const loadCharacters = async (currentStoryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('story_characters')
        .select('character_id, characters(*)')
        .eq('story_id', currentStoryId);

      if (fetchError) {
        console.error('Error loading characters for story:', fetchError);
        setError(`Error al cargar personajes: ${fetchError.message}`);
        return;
      }

      if (data) {
        const fetchedCharacters = data.map((item: any) => item.characters as Character).filter(Boolean);
        setCharacters(fetchedCharacters); // Update local state
        setWizardCharacters(fetchedCharacters); // Update global wizard context if needed for other components
      }
    } catch (err: any) {
      console.error('Error processing characters:', err);
      setError(`Error inesperado al procesar personajes: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (storyId && supabase && storyId !== 'new') { // Do not load for 'new' storyId
      loadCharacters(storyId);
    } else if (storyId === 'new') {
      setCharacters([]); // Reset characters for new story
      setWizardCharacters([]); // Reset global characters
      // Also, update step status for 'new' story if needed (likely invalid until a character is made for a *saved* story)
      if (typeof currentStep === 'number') {
        setStepStatus(currentStep, false);
      } else {
        setStepStatus('personajes', false);
      }
    }
  }, [storyId, supabase, setWizardCharacters, currentStep, setStepStatus]); // Added dependencies

  const handleAdd = () => {
    setEditingCharacterId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingCharacterId(id);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCharacterId(null);
    // Optionally, reload characters if a save happened
    if (storyId) {
        loadCharacters(storyId); // Refresh characters after closing form
    }
  };

  const handleSaveCharacter = async (savedCharFromForm: Character) => {
    if (!storyId || !supabase) {
        setError("Error: No se pudo guardar el personaje. Faltan datos de historia o conexión.");
        return;
    }

    try {
      if (!editingCharacterId) { // Create Mode
        // CharacterForm should have created the character. Now link it to the story.
        if (!savedCharFromForm || !savedCharFromForm.id) {
          setError("Error: El formulario no devolvió un ID de personaje válido.");
          return;
        }
        const { error: insertError } = await supabase
          .from('story_characters')
          .insert({ story_id: storyId, character_id: savedCharFromForm.id });

        if (insertError) {
          console.error('Error linking character to story:', insertError);
          setError(`Error al vincular personaje: ${insertError.message}`);
          return; // Prevent further execution if linking fails
        }
      }
      // Edit Mode: CharacterForm handles the update. No specific action here for story_characters.

      await loadCharacters(storyId); // Refresh the character list
      handleCloseForm(); // Close the modal
    } catch (err) {
      console.error('Error saving character relationship:', err);
      setError("Error inesperado al guardar la relación del personaje.");
    }
  };
  
  const handleDeleteCharacter = async (characterIdToDelete: string) => {
    if (!storyId || !supabase) return;
    setError(null);
    try {
        const { error: storyCharError } = await supabase
            .from('story_characters')
            .delete()
            .match({ story_id: storyId, character_id: characterIdToDelete });

        if (storyCharError) throw storyCharError;

        // Consider if the character itself should be deleted if no longer referenced.
        // For now, only the link to the story is removed.

        const updatedCharactersState = characters.filter(c => c.id !== characterIdToDelete);
        setCharacters(updatedCharactersState);
        setWizardCharacters(updatedCharactersState);

    } catch (err: any) {
        console.error('Error deleting character:', err);
        setError(`Error al eliminar personaje: ${err.message}`);
    }
  };


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Personajes de tu Historia
        </h2>
        <p className="text-gray-600">
          Gestiona los personajes de tu cuento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onEdit={handleEdit} // Pass handleEdit directly, CharacterCard will call it with ID
            onDelete={handleDeleteCharacter} // Pass handleDeleteCharacter directly
          />
        ))}

        {characters.length < 3 && storyId !== 'new' && (
          <CharacterCard
            isAddCard={true}
            onClick={handleAdd} // handleAdd is already defined to open the modal for new character
          />
        )}
      </div>
      
      {isLoading && <p className="text-center py-4">Cargando personajes...</p>}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}


      {isFormOpen && storyId && storyId !== 'new' && (
        <Modal 
            isOpen={isFormOpen} 
            onClose={handleCloseForm} 
            title={editingCharacterId ? "Editar Personaje" : "Añadir Nuevo Personaje"}
        >
          <CharacterForm
            characterId={editingCharacterId}
            storyId={storyId}
            onSave={handleSaveCharacter}
            onCancel={handleCloseForm}
          />
        </Modal>
      )}
    </div>
  );
};

export default CharactersStep;