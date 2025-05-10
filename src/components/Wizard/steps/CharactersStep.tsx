import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useAuth } from '../../../context/AuthContext';
import { Magnet as Magic, RefreshCw, Trash2, Plus, Loader, Upload, X } from 'lucide-react';
import { Character } from '../../../types';
import Button from '../../UI/Button';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CharactersStep: React.FC = () => {
  const { characters, setCharacters } = useWizard();
  const { supabase, user } = useAuth();
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadUserCharacters();
    }
  }, [user]);

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async (base64Image: string, characterId: string) => {
    setIsAnalyzing(true);
    setUploadError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-character`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.description) {
        throw new Error('No description received from analysis');
      }

      const character = characters.find(c => c.id === characterId);
      if (character) {
        updateCharacter(characterId, {
          description: character.description 
            ? `${character.description}\n\nAnálisis de la imagen:\n${data.description}`
            : data.description
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setUploadError(
        error instanceof Error 
          ? `Error al analizar la imagen: ${error.message}` 
          : 'Error al analizar la imagen'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  const handleFileUpload = async (characterId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const existingImages = character.variants?.length || 0;
    const remainingSlots = 3 - existingImages;

    if (files.length > remainingSlots) {
      setUploadError(`Solo puedes subir ${remainingSlots} imagen${remainingSlots !== 1 ? 'es' : ''} más`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE) {
        setUploadError('El archivo es demasiado grande. Máximo 5MB');
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError('Tipo de archivo no permitido. Use JPG, PNG o WebP');
        return;
      }

      try {
        const base64Image = await getBase64(file);
        await analyzeImage(base64Image, characterId);
        
        // Add temporary preview URL for the uploaded image
        const previewUrl = URL.createObjectURL(file);
        const updatedVariants = [
          ...(character.variants || []),
          {
            id: Date.now().toString(),
            imageUrl: previewUrl,
            seed: Date.now().toString(),
            style: 'uploaded'
          }
        ];

        await updateCharacter(characterId, { variants: updatedVariants });
      } catch (error) {
        console.error('Error processing image:', error);
        setUploadError('Error al procesar la imagen');
        return;
      }
    }
  };

  const removeImage = async (characterId: string, variantId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const variant = character.variants.find(v => v.id === variantId);
    if (variant && variant.style === 'uploaded') {
      URL.revokeObjectURL(variant.imageUrl);
    }

    const updatedVariants = character.variants.filter(v => v.id !== variantId);
    await updateCharacter(characterId, { variants: updatedVariants });
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
        const character = characters.find(c => c.id === id);
        if (character) {
          // Clean up any object URLs
          character.variants.forEach(variant => {
            if (variant.style === 'uploaded') {
              URL.revokeObjectURL(variant.imageUrl);
            }
          });
        }

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

    if (id.length === 36) {
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

  const generateVariants = async (id: string) => {
    const character = characters.find((c) => c.id === id);
    if (!character || !character.name || !character.description) return;

    setGeneratingFor(id);
    setUploadError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-variations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: character.name,
          description: character.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generating variations');
      }

      const data = await response.json();
      
      if (!data.variations || !data.spriteSheet) {
        throw new Error('Invalid response format from server');
      }

      updateCharacter(id, {
        variants: [...data.variations, data.spriteSheet],
        selectedVariant: null
      });
    } catch (error) {
      console.error('Error generating variations:', error);
      setUploadError(
        error instanceof Error 
          ? `Error al generar variaciones: ${error.message}` 
          : 'Error al generar variaciones'
      );
    } finally {
      setGeneratingFor(null);
    }
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
          Describe hasta 3 personajes para tu cuento. Puedes subir imágenes o generarlas.
        </p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {uploadError}
        </div>
      )}

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

                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={(e) => handleFileUpload(character.id, e.target.files)}
                  />
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={character.variants.length >= 3 || isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        <span>Analizando imagen...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        <span>Subir imágenes ({character.variants.length}/3)</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => generateVariants(character.id)}
                    disabled={!character.name || !character.description || generatingFor === character.id}
                    className="w-full"
                  >
                    {generatingFor === character.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Magic className="w-4 h-4 mr-2" />
                        <span>Generar imágenes</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                {character.variants.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Imágenes del personaje</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {character.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="relative group"
                        >
                          <div
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
                          <button
                            onClick={() => removeImage(character.id, variant.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="text-center p-6">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Sube hasta 3 imágenes o genera variantes automáticamente
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