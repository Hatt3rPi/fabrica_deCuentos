import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useAuth } from '../../../context/AuthContext';
import { Upload, RefreshCw, Trash2, Plus, Loader, AlertCircle } from 'lucide-react';
import { Character } from '../../../types';
import Button from '../../UI/Button';
import { useCharacterStore } from '../../../stores/characterStore';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const DEBOUNCE_DELAY = 500; // 500ms debounce delay

const CharactersStep: React.FC = () => {
  const { characters, setCharacters } = useWizard();
  const { supabase, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCharacters: setStoreCharacters } = useCharacterStore();
  const updateTimeoutRef = useRef<number>();

  useEffect(() => {
    if (user) {
      loadUserCharacters();
    }
  }, [user]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const loadUserCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const processedCharacters = data.map(char => ({
          ...char,
          images: char.reference_urls || [],
          thumbnailUrl: char.thumbnail_url
        }));
        setCharacters(processedCharacters);
        setStoreCharacters(processedCharacters);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImageToStorage = async (file: File, characterId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${characterId}/${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError, data } = await supabase.storage
      .from('reference-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('reference-images')
      .getPublicUrl(filePath);

    return publicUrl;
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
      const publicUrl = await uploadImageToStorage(file, characterId);
      const character = characters.find(c => c.id === characterId);
      if (!character) return;

      const updatedCharacter = {
        ...character,
        reference_urls: [...(character.reference_urls || []), publicUrl]
      };

      await updateCharacter(characterId, { reference_urls: updatedCharacter.reference_urls });
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

    const description = typeof character.description === 'object' ? character.description.es : character.description;
    if (!description && (!character.reference_urls || character.reference_urls.length === 0)) {
      setUploadError('Se requiere una descripción o una imagen del personaje');
      return;
    }

    setIsGenerating(characterId);
    setUploadError(null);

    try {
      const payload = {
        description: description || '',
        name: character.name || '',
        age: character.age || '',
        referenceImage: character.reference_urls?.[0] || null
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de red' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.thumbnailUrl) {
        throw new Error('No se pudo generar la miniatura');
      }

      await updateCharacter(characterId, {
        thumbnail_url: data.thumbnailUrl,
        description: data.description || character.description
      });

      // Update global store
      const updatedCharacters = characters.map(c => 
        c.id === characterId 
          ? { ...c, thumbnailUrl: data.thumbnailUrl, description: data.description || c.description }
          : c
      );
      setStoreCharacters(updatedCharacters);

    } catch (error) {
      console.error('Error generating thumbnail:', error);

      if (retryCount < MAX_RETRIES) {
        setTimeout(() => generateThumbnail(characterId, retryCount + 1), RETRY_DELAY * Math.pow(2, retryCount));
        setUploadError('Error al generar. Reintentando...');
        return;
      }

      setUploadError(error.message || 'Error al generar la miniatura');
    } finally {
      setIsGenerating(null);
    }
  };

  const addCharacter = async () => {
    if (characters.length < 3) {
      try {
        const { data, error } = await supabase
          .from('characters')
          .insert({
            user_id: user?.id,
            name: '',
            age: '',
            description: { es: '', en: '' },
            reference_urls: [],
            thumbnail_url: null
          })
          .select()
          .single();

        if (error) throw error;

        const newCharacter = {
          ...data,
          images: [],
          thumbnailUrl: null
        };

        setCharacters([...characters, newCharacter]);
        setStoreCharacters([...characters, newCharacter]);
      } catch (error) {
        console.error('Error creating character:', error);
      }
    }
  };

  const removeCharacter = async (id: string) => {
    if (characters.length > 1) {
      try {
        // Delete images from storage
        const character = characters.find(c => c.id === id);
        if (character?.reference_urls?.length) {
          for (const url of character.reference_urls) {
            const path = url.split('/').pop();
            if (path) {
              await supabase.storage
                .from('reference-images')
                .remove([`${id}/${path}`]);
            }
          }
        }

        // Delete record from database
        await supabase
          .from('characters')
          .delete()
          .eq('id', id);

        const updatedCharacters = characters.filter((c) => c.id !== id);
        setCharacters(updatedCharacters);
        setStoreCharacters(updatedCharacters);
      } catch (error) {
        console.error('Error removing character:', error);
      }
    }
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Update local state immediately for smooth UI
    const updatedCharacters = characters.map((character) =>
      character.id === id ? { ...character, ...updates } : character
    );
    setCharacters(updatedCharacters);

    // Debounce the database update
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const character = characters.find(c => c.id === id);
        if (!character) return;

        // Handle description update
        let finalUpdates = { ...updates };
        if ('description' in updates) {
          const currentDescription = typeof character.description === 'object' 
            ? character.description 
            : { es: character.description, en: '' };
          
          finalUpdates.description = {
            ...currentDescription,
            es: updates.description as string
          };
        }

        const { error } = await supabase
          .from('characters')
          .update({
            ...finalUpdates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        setStoreCharacters(updatedCharacters);
      } catch (error) {
        console.error('Error updating character:', error);
        // Revert local state on error
        setCharacters(characters);
        setStoreCharacters(characters);
      }
    }, DEBOUNCE_DELAY);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Personajes de tu Historia
        </h2>
        <p className="text-gray-600">
          Crea hasta 3 personajes para tu cuento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((character) => (
          <div
            key={character.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Character thumbnail */}
            <div className="aspect-square relative bg-gray-100">
              {character.thumbnailUrl ? (
                <img
                  src={character.thumbnailUrl}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Sube una foto o describe al personaje
                    </p>
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {isGenerating === character.id && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Generando miniatura...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Character form */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) =>
                    updateCharacter(character.id, { name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nombre del personaje"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad
                </label>
                <input
                  type="text"
                  value={character.age}
                  onChange={(e) =>
                    updateCharacter(character.id, { age: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Edad del personaje"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={
                    typeof character.description === 'object'
                      ? character.description.es
                      : character.description
                  }
                  onChange={(e) =>
                    updateCharacter(character.id, { description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe al personaje..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imágenes de referencia
                </label>
                <div className="flex flex-wrap gap-2">
                  {character.reference_urls?.map((url, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 relative rounded overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Referencia ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {(!character.reference_urls ||
                    character.reference_urls.length < 3) && (
                    <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-purple-500">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(character.id, e.target.files)
                        }
                      />
                      <Plus className="w-6 h-6 text-gray-400" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => generateThumbnail(character.id)}
                  disabled={isGenerating === character.id}
                  className="flex-1"
                >
                  {isGenerating === character.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Generar</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => removeCharacter(character.id)}
                  disabled={characters.length <= 1}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </Button>
              </div>
            </div>
          </div>
        ))}

        {characters.length < 3 && (
          <button
            onClick={addCharacter}
            className="h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors"
          >
            <Plus className="w-12 h-12" />
            <span className="text-lg">Añadir personaje</span>
          </button>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default CharactersStep;