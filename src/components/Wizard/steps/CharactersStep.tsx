import React, { useState, useEffect } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useAuth } from '../../../context/AuthContext';
import { Magnet as Magic, RefreshCw, Trash2, Plus, Loader } from 'lucide-react';
import { Character } from '../../../types';

const CharactersStep: React.FC = () => {
  const { characters, setCharacters } = useWizard();
  const { supabase, user } = useAuth();
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserCharacters();
    }
  }, [user]);

  const loadUserCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setCharacters(data.map(char => ({
          ...char,
          variants: char.variants || [],
          selectedVariant: char.selected_variant
        })));
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCharacter = () => {
    if (characters.length < 3) {
      const newCharacter = {
        id: Date.now().toString(),
        user_id: user?.id || '',
        name: '',
        description: '',
        selected_variant: null,
        variants: [],
      };
      setCharacters([...characters, newCharacter]);
    }
  };

  const removeCharacter = async (id: string) => {
    if (characters.length > 1) {
      try {
        // If the character exists in the database, delete it
        if (id.length === 36) { // UUID length check
          await supabase
            .from('characters')
            .delete()
            .eq('id', id);
        }
        setCharacters(characters.filter((c) => c.id !== id));
      } catch (error) {
        console.error('Error removing character:', error);
      }
    }
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    const updatedCharacters = characters.map((character) =>
      character.id === id ? { ...character, ...updates } : character
    );
    setCharacters(updatedCharacters);

    // If the character exists in the database, update it
    if (id.length === 36) { // UUID length check
      try {
        const { error } = await supabase
          .from('characters')
          .update({
            ...updates,
            selected_variant: updates.selectedVariant,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating character:', error);
      }
    } else if (updates.name && updates.description) {
      // If it's a new character with required fields, create it
      try {
        const { data, error } = await supabase
          .from('characters')
          .insert({
            name: updates.name,
            description: updates.description,
            user_id: user?.id,
            variants: updates.variants || [],
            selected_variant: updates.selectedVariant,
          })
          .select()
          .single();

        if (error) throw error;

        // Update the local state with the new database ID
        if (data) {
          setCharacters(characters.map(char =>
            char.id === id ? { ...char, id: data.id } : char
          ));
        }
      } catch (error) {
        console.error('Error creating character:', error);
      }
    }
  };

  const generateVariants = (id: string) => {
    const character = characters.find((c) => c.id === id);
    if (!character || !character.name || !character.description) return;

    setGeneratingFor(id);

    // Simular generación de variantes con un timeout
    setTimeout(() => {
      // Generar variantes de muestra (en una aplicación real, esto vendría de la API)
      const variants = [
        {
          id: '1',
          imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
          seed: '12345',
          style: 'cartoon',
        },
        {
          id: '2',
          imageUrl: 'https://images.pexels.com/photos/1252869/pexels-photo-1252869.jpeg',
          seed: '67890',
          style: 'realistic',
        },
        {
          id: '3',
          imageUrl: 'https://images.pexels.com/photos/1468376/pexels-photo-1468376.jpeg',
          seed: '54321',
          style: 'watercolor',
        },
        {
          id: '4',
          imageUrl: 'https://images.pexels.com/photos/3662157/pexels-photo-3662157.jpeg',
          seed: '09876',
          style: 'pixar',
        },
      ];

      updateCharacter(id, { variants, selectedVariant: null });
      setGeneratingFor(null);
    }, 2000);
  };

  const selectVariant = (characterId: string, variantId: string) => {
    updateCharacter(characterId, { selectedVariant: variantId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Crea tus personajes</h2>
        <p className="text-gray-600">
          Describe hasta 3 personajes para tu cuento. Podrás generar imágenes a partir de tu descripción.
        </p>
      </div>

      <div className="space-y-8">
        {characters.map((character, index) => (
          <div key={character.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-purple-700">Personaje {index + 1}</h3>
              {characters.length > 1 && (
                <button
                  onClick={() => removeCharacter(character.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Eliminar personaje"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label htmlFor={`name-${character.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del personaje
                  </label>
                  <input
                    type="text"
                    id={`name-${character.id}`}
                    value={character.name}
                    onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej. Luna, el gato mágico"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor={`description-${character.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción detallada
                  </label>
                  <textarea
                    id={`description-${character.id}`}
                    value={character.description}
                    onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe cómo es el personaje, su personalidad, apariencia..."
                  />
                </div>

                <button
                  onClick={() => generateVariants(character.id)}
                  disabled={!character.name || !character.description || generatingFor === character.id}
                  className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 ${
                    !character.name || !character.description || generatingFor === character.id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                  }`}
                >
                  {generatingFor === character.id ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Magic className="w-5 h-5" />
                      <span>Generar imágenes</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                {character.variants.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Selecciona una variante</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {character.variants.map((variant) => (
                        <div
                          key={variant.id}
                          onClick={() => selectVariant(character.id, variant.id)}
                          className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                            character.selectedVariant === variant.id
                              ? 'border-purple-500 ring-2 ring-purple-300'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <img
                            src={variant.imageUrl}
                            alt={`Variante ${variant.id} de ${character.name}`}
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="text-center p-6">
                      <Magic className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Completa la información y haz clic en "Generar imágenes" para ver las opciones
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {characters.length < 3 && (
        <div className="flex justify-center">
          <button
            onClick={addCharacter}
            className="py-2 px-4 border border-purple-300 rounded-full text-purple-700 flex items-center gap-2 hover:bg-purple-50"
          >
            <Plus className="w-5 h-5" />
            <span>Añadir personaje</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CharactersStep;