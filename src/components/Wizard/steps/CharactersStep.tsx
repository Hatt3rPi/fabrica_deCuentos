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
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setCharacters(data);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (characterId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const file = files[0];

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
      await updateCharacter(characterId, {
        images: [base64Image],
        thumbnailUrl: null
      });

      // Generate thumbnail after uploading image
      await generateThumbnail(characterId);
    } catch (error) {
      console.error('Error processing image:', error);
      setUploadError('Error al procesar la imagen');
    }
  };

  const generateThumbnail = async (characterId: string, retryCount = 0) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) {
      setUploadError('No se encontró el personaje');
      return;
    }

    if (!character.description && (!character.images || character.images.length === 0)) {
      setUploadError('Se requiere una descripción o una imagen del personaje');
      return;
    }

    setIsGenerating(characterId);
    setUploadError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: character.images?.[0] || null,
          userNotes: character.description || '',
          name: character.name || '',
          age: character.age || ''
        }),
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

      // Extract the Spanish description from the response
      const description = data.description?.es || character.description;

      await updateCharacter(characterId, {
        thumbnailUrl: data.thumbnailUrl,
        description
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);

      if (retryCount < MAX_RETRIES && error.message.includes('429')) {
        setTimeout(() => generateThumbnail(characterId, retryCount + 1), RETRY_DELAY * Math.pow(2, retryCount));
        setUploadError('Demasiadas solicitudes. Reintentando...');
        return;
      }

      setUploadError(error.message || 'Error al generar la miniatura');
    } finally {
      setIsGenerating(null);
    }
  };

  const addCharacter = () => {
    if (characters.length < 3) {
      const newCharacter: Character = {
        id: crypto.randomUUID(),
        user_id: user?.id || '',
        name: '',
        description: '',
        age: '',
        images: [],
        thumbnailUrl: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating character:', error);
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
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Creación de personajes</h2>
        <p className="text-gray-600">
          Crea hasta 3 personajes para tu historia
        </p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{uploadError}</p>
        </div>
      )}

      <div className="space-y-6">
        {characters.map((character, index) => (
          <div key={character.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Personaje {index + 1}
              </h3>
              {characters.length > 1 && (
                <button
                  onClick={() => removeCharacter(character.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Luna"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Edad
                  </label>
                  <input
                    type="text"
                    value={character.age}
                    onChange={(e) => updateCharacter(character.id, { age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: 8 años"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={character.description}
                    onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe cómo es el personaje..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen de referencia
                  </label>
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
                    disabled={isGenerating === character.id}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    <span>Subir imagen</span>
                  </Button>
                </div>

                {character.thumbnailUrl ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={character.thumbnailUrl}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="outline"
                      onClick={() => generateThumbnail(character.id)}
                      disabled={isGenerating === character.id}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    >
                      {isGenerating === character.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          <span>Regenerar</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Button
                      onClick={() => generateThumbnail(character.id)}
                      disabled={isGenerating === character.id || (!character.description && !character.images?.length)}
                    >
                      {isGenerating === character.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          <span>Generar imagen</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {characters.length < 3 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={addCharacter}>
            <Plus className="w-4 h-4 mr-2" />
            <span>Añadir personaje</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CharactersStep;