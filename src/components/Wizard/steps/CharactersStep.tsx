import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useAuth } from '../../../context/AuthContext';
import { Upload, RefreshCw, Trash2, Plus, Loader, AlertCircle } from 'lucide-react';
import { Character } from '../../../types';
import Button from '../../UI/Button';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const CharactersStep: React.FC = () => {
  const { characters, setCharacters } = useWizard();
  const { supabase, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDescription = (description: string | { es: string; en: string }) => {
    if (typeof description === 'object' && description.es) {
      return description.es;
    }
    return description || '';
  };

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

      if (data) {
        setCharacters(data.map(char => ({
          ...char,
          images: char.images || [],
          thumbnailUrl: char.thumbnail_url
        })));
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (characterId: string, files: FileList | null) => {
    if (!files || files.length === 0) {
      setUploadError('Necesitamos al menos una foto del personaje');
      return;
    }

    const file = files[0];
    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Imagen demasiado grande, sube una de hasta 5 MB');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Formato no soportado, usa JPG o PNG');
      return;
    }

    setIsUploading(true);

    try {
      const character = characters.find(c => c.id === characterId);
      if (!character) return;

      const updatedCharacter = {
        ...character,
        images: [...(character.images || []), file]
      };

      await updateCharacter(characterId, { images: updatedCharacter.images });
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const generateThumbnail = async (characterId: string, retryCount = 0) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) {
      setUploadError('No se encontró el personaje');
      return;
    }

    const description = getDescription(character.description);
    if (!description && (!character.images || character.images.length === 0)) {
      setUploadError('Se requiere una descripción o una imagen del personaje');
      return;
    }

    setIsGenerating(characterId);
    setUploadError(null);

    try {
      const formData = new FormData();
      
      // Ensure we have a valid image file
      if (character.images?.[0] instanceof File) {
        formData.append('image', character.images[0], character.images[0].name);
      } else {
        throw new Error('No se encontró una imagen válida');
      }

      // Ensure all text fields are strings
      formData.append('name', character.name?.toString() || '');
      formData.append('age', character.age?.toString() || '');
      formData.append('description', description?.toString() || '');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al generar la miniatura. Por favor, inténtalo de nuevo.');
      }

      const data = await response.json();

      if (!data.thumbnailUrl) {
        throw new Error('No se pudo generar la miniatura');
      }

      await updateCharacter(characterId, {
        thumbnailUrl: data.thumbnailUrl,
        description: data.description || character.description
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);

      // Generic retry logic for any error
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        setUploadError(`Error al generar la miniatura. Reintentando en ${delay/1000} segundos...`);
        setTimeout(() => generateThumbnail(characterId, retryCount + 1), delay);
        return;
      }

      setUploadError('Error al generar la miniatura. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setIsGenerating(null);
    }
  };

  const addCharacter = () => {
    if (characters.length < 3) {
      const newCharacter = {
        id: Date.now().toString(),
        user_id: user?.id || '',
        name: '',
        age: '',
        description: '',
        images: [],
        thumbnailUrl: null
      };
      setCharacters([...characters, newCharacter]);
    }
  };

  const removeCharacter = async (id: string) => {
    if (characters.length > 1) {
      try {
        if (id.length === 36) {
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
            thumbnail_url: updates.thumbnailUrl,
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
            age: updates.age,
            description: updates.description,
            user_id: user?.id,
            images: updates.images || [],
            thumbnail_url: updates.thumbnailUrl
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
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Creación de personaje</h2>
        <p className="text-gray-600">
          Describe tus personajes y nosotros les daremos vida
        </p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{uploadError}</p>
        </div>
      )}

      <div className="space-y-8">
        {characters.map((character, index) => (
          <div key={character.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-6">
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
              <div className="space-y-4">
                <div>
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

                <div>
                  <label htmlFor={`age-${character.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Edad
                  </label>
                  <input
                    type="text"
                    id={`age-${character.id}`}
                    value={character.age}
                    onChange={(e) => updateCharacter(character.id, { age: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej. 8 años"
                  />
                </div>

                <div>
                  <label htmlFor={`description-${character.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción detallada
                  </label>
                  <textarea
                    id={`description-${character.id}`}
                    value={getDescription(character.description)}
                    onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe cómo es el personaje, su personalidad, apariencia..."
                  />
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileUpload(character.id, e.target.files)}
                  />
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        <span>Subiendo imagen...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        <span>Subir imagen de referencia</span>
                      </>
                    )}
                  </Button>
                </div>

                {character.images?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {character.images.map((image, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Referencia ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {character.thumbnailUrl ? (
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={character.thumbnailUrl}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500 text-center px-4">
                      Sube una imagen o describe tu personaje para generar una vista previa
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => generateThumbnail(character.id)}
                  disabled={
                    (!character.description && (!character.images || character.images.length === 0)) || 
                    isGenerating === character.id
                  }
                  className="w-full"
                >
                  {isGenerating === character.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <span>Generar miniatura</span>
                    </>
                  )}
                </Button>
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