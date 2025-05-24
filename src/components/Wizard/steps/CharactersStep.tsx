import React, { useState, useEffect } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useAuth } from '../../../context/AuthContext';
import { useCharacterStore } from '../../../stores/characterStore';
import { useCharacterAutosave } from '../../../hooks/useCharacterAutosave';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { Character } from '../../../types';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader, AlertCircle, Wand2, Plus, Trash2, RefreshCw, Info } from 'lucide-react';

const CharactersStep: React.FC = () => {
  const { characters, setCharacters } = useWizard();
  const { supabase, user } = useAuth();
  const { setCharacters: setStoreCharacters } = useCharacterStore();
  const { createNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fieldsReadOnly, setFieldsReadOnly] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    age?: string;
    description?: string;
    image?: string;
  }>({});

  // Obtener el personaje activo
  const activeCharacter = characters[activeCharacterIndex] || {
    name: '',
    age: '',
    description: { es: '', en: '' },
    reference_urls: [],
    thumbnailUrl: null,
  };

  const { currentCharacterId, recoverFromBackup } = useCharacterAutosave(activeCharacter, activeCharacter?.id);

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
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const processedCharacters = data.map(char => ({
          ...char,
          id: char.id,
          name: char.name || '',
          age: char.age || '',
          description: char.description || { es: '', en: '' },
          reference_urls: char.reference_urls || [],
          thumbnailUrl: char.thumbnail_url
        }));
        setCharacters(processedCharacters);
        setStoreCharacters(processedCharacters);
      } else {
        // Si no hay personajes, crear uno nuevo
        addCharacter();
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      setError('Error al cargar los personajes');
    } finally {
      setIsLoading(false);
    }
  };

  const addCharacter = async () => {
    if (characters.length < 3) {
      try {
        const newCharacterId = crypto.randomUUID();
        const newCharacter = {
          id: newCharacterId,
          user_id: user?.id,
          name: '',
          age: '',
          description: { es: '', en: '' },
          reference_urls: [],
          thumbnailUrl: null
        };

        const { error } = await supabase
          .from('characters')
          .insert({
            id: newCharacterId,
            user_id: user?.id,
            name: '',
            age: '',
            description: { es: '', en: '' },
            reference_urls: [],
            thumbnail_url: null
          });

        if (error) throw error;

        const updatedCharacters = [...characters, newCharacter];
        setCharacters(updatedCharacters);
        setStoreCharacters(updatedCharacters);
        setActiveCharacterIndex(updatedCharacters.length - 1);
      } catch (error) {
        console.error('Error creating character:', error);
        setError('Error al crear un nuevo personaje');
      }
    }
  };

  const removeCharacter = async (id: string) => {
    if (characters.length > 1) {
      try {
        // Delete record from database
        await supabase
          .from('characters')
          .delete()
          .eq('id', id);

        const updatedCharacters = characters.filter((c) => c.id !== id);
        setCharacters(updatedCharacters);
        setStoreCharacters(updatedCharacters);
        
        // Ajustar el índice activo si es necesario
        if (activeCharacterIndex >= updatedCharacters.length) {
          setActiveCharacterIndex(updatedCharacters.length - 1);
        }
      } catch (error) {
        console.error('Error removing character:', error);
        setError('Error al eliminar el personaje');
      }
    }
  };

  const updateCharacter = (updates: Partial<Character>) => {
    const updatedCharacter = { ...activeCharacter, ...updates };
    const updatedCharacters = characters.map((character, index) =>
      index === activeCharacterIndex ? updatedCharacter : character
    );
    setCharacters(updatedCharacters);
    setStoreCharacters(updatedCharacters);
  };

  const uploadImageToStorage = async (file: File, characterId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `reference-images/${user.id}/${characterId}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('storage')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('storage')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024,
    disabled: fieldsReadOnly,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      setIsLoading(true);
      setError(null);
      setFieldErrors(prev => ({ ...prev, image: undefined }));

      try {
        const file = acceptedFiles[0];
        const characterId = activeCharacter.id || crypto.randomUUID();
        const publicUrl = await uploadImageToStorage(file, characterId);

        updateCharacter({
          reference_urls: [...(activeCharacter.reference_urls || []), publicUrl]
        });
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Error al subir la imagen');
      } finally {
        setIsLoading(false);
      }
    }
  });

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const callAnalyzeCharacter = async (attempt = 0): Promise<any> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-character`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: activeCharacter.name,
          age: activeCharacter.age,
          description: typeof activeCharacter.description === 'object' 
            ? activeCharacter.description.es 
            : activeCharacter.description,
          imageUrl: activeCharacter.reference_urls?.[0] || null
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.');
        }
        throw new Error('Error al analizar el personaje');
      }

      return await response.json();
    } catch (error) {
      if (attempt < 3) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 8000);
        await sleep(backoffTime);
        return callAnalyzeCharacter(attempt + 1);
      }
      throw error;
    }
  };

  const canGenerateThumbnail = (character: Character): boolean => {
    const description = typeof character.description === 'object' ? character.description.es : character.description;
    return !!(description && description.trim() !== '') || !!(character.reference_urls && character.reference_urls.length > 0);
  };

  const generateThumbnail = async () => {
    if (!user) throw new Error('User not authenticated');
    
    if (!activeCharacter.name?.trim() || !activeCharacter.age?.trim()) {
      setFieldErrors({
        name: !activeCharacter.name?.trim() ? "El nombre es obligatorio" : undefined,
        age: !activeCharacter.age?.trim() ? "La edad es obligatoria" : undefined,
      });
      return;
    }

    const description = typeof activeCharacter.description === 'object' 
      ? activeCharacter.description.es 
      : activeCharacter.description;

    if (!description && !activeCharacter.reference_urls?.[0]) {
      setFieldErrors({
        description: "Se requiere una descripción o una imagen",
        image: "Se requiere una descripción o una imagen"
      });
      return;
    }

    setFieldsReadOnly(true);
    setIsAnalyzing(true);
    setError(null);
    setRetryCount(0);

    try {
      const descriptionData = await callAnalyzeCharacter();
      
      if (!descriptionData || !descriptionData.description) {
        throw new Error('No se pudo generar la descripción del personaje');
      }

      updateCharacter({
        description: {
          es: descriptionData.description.es || (typeof activeCharacter.description === 'object' ? activeCharacter.description.es : ''),
          en: descriptionData.description.en || (typeof activeCharacter.description === 'object' ? activeCharacter.description.en : '')
        }
      });

      setIsAnalyzing(false);
      setIsGeneratingThumbnail(true);

      const thumbnailResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: activeCharacter.name?.trim(),
          age: activeCharacter.age?.trim(),
          description: {
            es: descriptionData.description.es || (typeof activeCharacter.description === 'object' ? activeCharacter.description.es : ''),
            en: descriptionData.description.en || (typeof activeCharacter.description === 'object' ? activeCharacter.description.en : '')
          },
          referenceImage: activeCharacter.reference_urls?.[0] || null
        })
      });

      if (!thumbnailResponse.ok) {
        const errorData = await thumbnailResponse.json().catch(() => ({}));
        if (thumbnailResponse.status === 429) {
          throw new Error('Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.');
        }
        throw new Error(errorData.error || 'Error al generar la miniatura. Por favor, verifica los datos e intenta de nuevo.');
      }

      const thumbnailData = await thumbnailResponse.json();

      if (!thumbnailData || !thumbnailData.thumbnailUrl) {
        throw new Error('No se recibió una URL válida para la miniatura');
      }

      const thumbnailPath = `thumbnails/${user.id}/${activeCharacter.id}.png`;
      const response = await fetch(thumbnailData.thumbnailUrl);
      const blob = await response.blob();
      
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(thumbnailPath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('storage')
        .getPublicUrl(thumbnailPath);

      updateCharacter({
        thumbnailUrl: publicUrl
      });

      // Mostrar notificación cuando se genera la miniatura con éxito
      createNotification(
        NotificationType.CHARACTER_GENERATION_COMPLETE,
        '¡Miniatura generada!',
        `La miniatura para ${activeCharacter.name} ha sido generada con éxito.`,
        NotificationPriority.MEDIUM,
        { characterId: activeCharacter.id }
      );

    } catch (error) {
      console.error("Error in thumbnail generation:", error);
      setError(error.message || 'Error al procesar el personaje. Por favor, intenta de nuevo.');
      
      // Notificación de error
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error en la generación',
        `Hubo un problema al generar la miniatura para ${activeCharacter.name}. ${error.message}`,
        NotificationPriority.HIGH
      );
    } finally {
      setIsAnalyzing(false);
      setIsGeneratingThumbnail(false);
      setFieldsReadOnly(false);
    }
  };

  // Renderizar la interfaz de usuario
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

      {/* Selector de personajes */}
      <div className="flex justify-center gap-4 mb-6">
        {characters.map((character, index) => (
          <button
            key={character.id}
            onClick={() => setActiveCharacterIndex(index)}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              index === activeCharacterIndex
                ? 'bg-purple-600 text-white ring-4 ring-purple-200'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {index + 1}
          </button>
        ))}
        {characters.length < 3 && (
          <button
            onClick={addCharacter}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Formulario del personaje activo */}
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={activeCharacter.name}
              onChange={(e) => {
                updateCharacter({ name: e.target.value });
                if (e.target.value.trim()) {
                  setFieldErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              disabled={fieldsReadOnly}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldErrors.name ? 'border-red-500' : 'border-gray-300'
              } ${fieldsReadOnly ? 'bg-gray-100' : ''}`}
              placeholder="Nombre del personaje"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edad
            </label>
            <input
              type="text"
              value={activeCharacter.age}
              onChange={(e) => {
                updateCharacter({ age: e.target.value });
                if (e.target.value.trim()) {
                  setFieldErrors(prev => ({ ...prev, age: undefined }));
                }
              }}
              disabled={fieldsReadOnly}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldErrors.age ? 'border-red-500' : 'border-gray-300'
              } ${fieldsReadOnly ? 'bg-gray-100' : ''}`}
              placeholder="Edad del personaje"
            />
            {fieldErrors.age && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.age}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={typeof activeCharacter.description === 'object' 
                ? activeCharacter.description.es 
                : activeCharacter.description}
              onChange={(e) => {
                updateCharacter({
                  description: { 
                    es: e.target.value, 
                    en: typeof activeCharacter.description === 'object' ? activeCharacter.description.en : '' 
                  }
                });
                if (e.target.value.trim()) {
                  setFieldErrors(prev => ({ ...prev, description: undefined }));
                }
              }}
              disabled={fieldsReadOnly}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldErrors.description ? 'border-red-500' : 'border-gray-300'
              } ${fieldsReadOnly ? 'bg-gray-100' : ''}`}
              rows={3}
              placeholder="Describe al personaje..."
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen de referencia
              </label>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className={`w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center ${
                  fieldsReadOnly ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-purple-500'
                } ${fieldErrors.image ? 'border-red-500' : 'border-gray-300'}`}>
                  {activeCharacter.reference_urls?.[0] ? (
                    <img
                      src={activeCharacter.reference_urls[0]}
                      alt="Referencia"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : isLoading ? (
                    <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${fieldErrors.image ? 'text-red-400' : 'text-gray-400'}`} />
                      <p className={`text-sm ${fieldErrors.image ? 'text-red-500' : 'text-gray-500'}`}>
                        Arrastra una imagen o haz clic para seleccionar
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {fieldErrors.image && !activeCharacter.reference_urls?.[0] && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.image}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miniatura generada
              </label>
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                {activeCharacter.thumbnailUrl ? (
                  <img
                    src={activeCharacter.thumbnailUrl}
                    alt="Miniatura"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : isAnalyzing ? (
                  <div className="text-center">
                    <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-purple-600">
                      {retryCount > 0 ? `Reintentando análisis (${retryCount}/3)...` : 'Analizando tu personaje...'}
                    </p>
                  </div>
                ) : isGeneratingThumbnail ? (
                  <div className="text-center">
                    <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-purple-600">Dibujando un nuevo héroe...</p>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-sm text-gray-500">
                      Usa el botón "Generar miniatura" cuando estés listo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(error || uploadError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error || uploadError}</p>
            </div>
          )}

          <div className="flex gap-4">
            {!activeCharacter.thumbnailUrl ? (
              <button
                type="button"
                onClick={generateThumbnail}
                disabled={isAnalyzing || isGeneratingThumbnail || fieldsReadOnly || !canGenerateThumbnail(activeCharacter)}
                className={`flex-1 py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                  isAnalyzing || isGeneratingThumbnail || fieldsReadOnly || !canGenerateThumbnail(activeCharacter)
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isAnalyzing || isGeneratingThumbnail ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>{isAnalyzing ? 'Analizando...' : 'Generando...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generar miniatura</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={generateThumbnail}
                disabled={isAnalyzing || isGeneratingThumbnail || fieldsReadOnly}
                className={`flex-1 py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                  isAnalyzing || isGeneratingThumbnail || fieldsReadOnly
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isAnalyzing || isGeneratingThumbnail ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>{isAnalyzing ? 'Analizando...' : 'Regenerando...'}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerar miniatura</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => removeCharacter(activeCharacter.id)}
              disabled={characters.length <= 1}
              className={`flex-1 py-3 px-4 border border-purple-600 text-purple-600 rounded-lg ${
                characters.length <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'
              }`}
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              <span>Eliminar</span>
            </button>
          </div>

          {!canGenerateThumbnail(activeCharacter) && (
            <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Añade una descripción o una imagen para generar la miniatura</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharactersStep;

