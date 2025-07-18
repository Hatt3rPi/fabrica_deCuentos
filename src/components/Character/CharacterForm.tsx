import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader, AlertCircle, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCharacterAutosave } from '../../hooks/useCharacterAutosave';
import { useNotifications } from '../../hooks/useNotifications';
import { useCharacter } from '../../hooks/useCharacter';
import { NotificationType, NotificationPriority } from '../../types/notification';
import { Character } from '../../types';
import { OverlayLoader } from '../UI/Loader';

interface CharacterFormProps {
  onSave?: (id: string) => void;
  onCancel?: () => void;
  /** ID del personaje a editar. Si no se proporciona se lee desde la ruta */
  id?: string;
}

const CharacterForm: React.FC<CharacterFormProps> = ({ onSave, onCancel, id: propId }) => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const id = propId || routeId;
  const { supabase, user } = useAuth();
  const { createNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [fieldsReadOnly, setFieldsReadOnly] = useState(false);
  const [thumbnailGenerated, setThumbnailGenerated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    age?: string;
    description?: string;
    image?: string;
  }>({});
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    age: '',
    description: { es: '', en: '' },
    reference_urls: [],
    thumbnailUrl: null,
  });

  const handleFallback = () => {
    setIsLoading(false);
    setIsAnalyzing(false);
    setIsGeneratingThumbnail(false);
    setIsRedirecting(false);
  };

  const { currentCharacterId, recoverFromBackup } = useCharacterAutosave(formData, id);
  const { generateAdditionalThumbnails } = useCharacter();
  
  const isEditMode = Boolean(id);

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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const callAnalyzeCharacter = async (attempt = 0): Promise<any> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-character`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          age: formData.age,
          description: formData.description.es,
          imageUrl: formData.reference_urls[0] || null
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

  useEffect(() => {
    const recoverState = async () => {
      if (id) {
        const backupState = await recoverFromBackup();
        if (backupState?.characters?.[0]) {
          setFormData(backupState.characters[0]);
        }
      }
    };

    recoverState();
  }, [id]);
  
  useEffect(() => {
    if (isEditMode && id) {
      const loadCharacter = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (data) {
            setFormData({
              name: data.name,
              age: data.age,
              description: data.description,
              reference_urls: data.reference_urls || [],
              thumbnailUrl: data.thumbnail_url,
            });
            if (data.thumbnail_url) {
              setThumbnailGenerated(true);
            }
          }
        } catch (err) {
          console.error('Error loading character:', err);
          setError('Error al cargar el personaje');
        } finally {
          setIsLoading(false);
        }
      };

      loadCharacter();
    }
  }, [id]);

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
        const characterId = id || crypto.randomUUID();
        const publicUrl = await uploadImageToStorage(file, characterId);

        setFormData(prev => ({
          ...prev,
          reference_urls: [...(prev.reference_urls || []), publicUrl]
        }));
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Error al subir la imagen');
      } finally {
        setIsLoading(false);
      }
    }
  });

  const canGenerateThumbnail = (character: Character): boolean => {
    const description = typeof character.description === 'object' ? character.description.es : character.description;
    return !!(description && description.trim() !== '') || !!(character.reference_urls && character.reference_urls.length > 0);
  };

  const generateThumbnail = async () => {
    if (!user) {
      createNotification(
        NotificationType.SYSTEM_ERROR,
        'Error de autenticación',
        'Debes iniciar sesión para generar una miniatura',
        NotificationPriority.HIGH
      );
      return;
    }

    setFieldsReadOnly(true);
    setError(null);
    setRetryCount(0);

    // Iniciar ambos procesos en paralelo
    setIsAnalyzing(true);
    setIsGeneratingThumbnail(true);

    try {
      // Ejecutar ambas llamadas API en paralelo
      const [descriptionPromise, thumbnailPromise] = await Promise.all([
        // Llamada a analyze-character (solo si hay descripción o imagen)
        (async () => {
          try {
            if (formData.description?.es || formData.reference_urls?.[0]) {
              const response = await callAnalyzeCharacter();
              if (response && response.description) {
                return response;
              }
            }
            return null;
          } catch (error) {
            console.error("Error in description generation:", error);
            return null;
          } finally {
            setIsAnalyzing(false);
          }
        })(),
        
        // Llamada a describe-and-sketch (para generar la miniatura)
        (async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
            const thumbnailResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: formData.name?.trim(),
                age: formData.age?.trim(),
                description: formData.description,
                referenceImage: formData.reference_urls?.[0] || null
              })
            });

            if (!thumbnailResponse.ok) {
              const errorData = await thumbnailResponse.json().catch(() => ({}));
              if (thumbnailResponse.status === 429) {
                throw new Error('Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.');
              }
              throw new Error(errorData.error || 'Error al generar la miniatura. Por favor, verifica los datos e intenta de nuevo.');
            }

            return await thumbnailResponse.json();
          } catch (error) {
            console.error("Error in thumbnail generation:", error);
            throw error;
          } finally {
            setIsGeneratingThumbnail(false);
          }
        })()
      ]);

      // Procesar los resultados de la descripción (si existe)
      if (descriptionPromise && descriptionPromise.description) {
        setFormData(prev => ({
          ...prev,
          description: {
            es: descriptionPromise.description.es || prev.description?.es || '',
            en: descriptionPromise.description.en || prev.description?.en || ''
          }
        }));
      }

      // Procesar los resultados de la miniatura
      if (!thumbnailPromise || !thumbnailPromise.thumbnailUrl) {
        throw new Error('No se recibió una URL válida para la miniatura');
      }

      const thumbnailPath = `thumbnails/${user.id}/${currentCharacterId}.png`;
      const response = await fetch(thumbnailPromise.thumbnailUrl);
      const blob = await response.blob();
      
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(thumbnailPath, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Error al subir la miniatura: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('storage')
        .getPublicUrl(thumbnailPath);

      setFormData(prev => ({
        ...prev,
        thumbnailUrl: publicUrl
      }));

      // Iniciar generación asincrónica de miniaturas adicionales
      generateAdditionalThumbnails({
        id: currentCharacterId,
        user_id: user.id,
        name: formData.name || '',
        age: formData.age || '',
        description: formData.description,
        images: [],
        thumbnailUrl: publicUrl,
        reference_urls: formData.reference_urls,
      });
      
      // Marcar que la miniatura ha sido generada exitosamente
      setThumbnailGenerated(true);

      createNotification(
        NotificationType.SYSTEM_SUCCESS,
        'Miniatura generada',
        `Se ha generado la miniatura para ${formData.name}`,
        NotificationPriority.NORMAL
      );
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setError(error.message || 'Error desconocido al generar la miniatura');
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error al generar miniatura',
        error.message || 'Ocurrió un error al generar la miniatura. Por favor, intenta de nuevo.',
        NotificationPriority.HIGH
      );
    } finally {
      setFieldsReadOnly(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!thumbnailGenerated) {
      setError('Debes generar una miniatura antes de guardar el personaje');
      return;
    }

    if (!user) {
      setError('Debes iniciar sesión para guardar el personaje');
      return;
    }

    try {
      setIsLoading(true);
      
      const characterData = {
        id: currentCharacterId,
        user_id: user.id,
        name: formData.name,
        age: formData.age,
        description: formData.description,
        reference_urls: formData.reference_urls,
        thumbnail_url: formData.thumbnailUrl,
      };

      const { error } = await supabase
        .from('characters')
        .upsert(characterData)
        .eq('id', currentCharacterId);

      if (error) throw error;

      // Mostrar notificación de éxito
      if (isEditMode) {
        createNotification(
          NotificationType.CHARACTER_GENERATION_COMPLETE,
          '¡Personaje actualizado!',
          `El personaje ${formData.name} ha sido actualizado con éxito.`,
          NotificationPriority.MEDIUM,
          { characterId: currentCharacterId }
        );
      } else {
        createNotification(
          NotificationType.CHARACTER_GENERATION_COMPLETE,
          '¡Personaje creado!',
          `El personaje ${formData.name} ha sido creado con éxito.`,
          NotificationPriority.HIGH,
          { characterId: currentCharacterId }
        );
      }

      setIsRedirecting(true);
      if (onSave) {
        onSave(currentCharacterId);
      } else {
        navigate('/nuevo-cuento/personajes');
      }
    } catch (err) {
      console.error('Error saving character:', err);
      setError('Error al guardar el personaje');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            data-testid="character-name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
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
            data-testid="character-age"
            value={formData.age}
            onChange={(e) => {
              setFormData({ ...formData, age: e.target.value });
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
            data-testid="character-description"
            value={formData.description?.es}
            onChange={(e) => {
              setFormData({
                ...formData,
                description: { es: e.target.value, en: '' }
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
              <input {...getInputProps()} data-testid="character-image-upload" />
              <div className={`w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center ${
                fieldsReadOnly ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-purple-500'
              } ${fieldErrors.image ? 'border-red-500' : 'border-gray-300'}`}>
                {formData.reference_urls?.[0] ? (
                  <img
                    src={formData.reference_urls[0]}
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
            {fieldErrors.image && !formData.reference_urls?.[0] && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.image}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miniatura generada
            </label>
            <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {formData.thumbnailUrl ? (
                <img
                  src={formData.thumbnailUrl}
                  alt="Miniatura"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : isGeneratingThumbnail ? (
                <div className="text-center">
                  <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-purple-600">
                    Generando miniatura...
                  </p>
                </div>
              ) : isAnalyzing ? (
                <div className="text-center">
                  <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-purple-600">
                    {retryCount > 0 ? `Reintentando análisis (${retryCount}/3)...` : 'Analizando tu personaje...'}
                  </p>
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          {!thumbnailGenerated ? (
            <button
              type="button"
              data-testid="generate-thumbnail"
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
              type="submit"
              data-testid="save-character"
              disabled={isLoading || isRedirecting}
              className={`flex-1 py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                isLoading || isRedirecting
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : isRedirecting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Redirigiendo...</span>
                </>
              ) : (
                <span>Guardar personaje</span>
              )}
            </button>
          )}

          <button
            type="button"
            data-testid="cancel-character"
            onClick={() => (onCancel ? onCancel() : navigate('/nuevo-cuento/personajes'))}
            className="flex-1 py-3 px-4 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
          >
            Cancelar
          </button>
        </div>
      </form>
      {(isLoading || isAnalyzing || isGeneratingThumbnail || isRedirecting) && (
        <OverlayLoader
          etapa="personajes"
          context={{ personaje: formData.name || 'tu personaje' }}
          onFallback={handleFallback}
        />
      )}
    </div>
  );
};

export default CharacterForm;
