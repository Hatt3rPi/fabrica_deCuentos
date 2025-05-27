import React, { useState, useEffect } from 'react';
// Removed useNavigate, useParams
import { useDropzone } from 'react-dropzone';
import { Upload, Loader, AlertCircle, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// Removed useCharacterStore as DB operations are now direct
// Removed useCharacterAutosave
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../types/notification';
import { Character } from '../../types';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs if needed for new characters

interface CharacterFormProps {
  characterId?: string | null;
  storyId: string; 
  onSave: (character: Character | { id: string }) => Promise<void> | void;
  onCancel: () => void;
}

const CharacterForm: React.FC<CharacterFormProps> = ({
  characterId: propCharacterId,
  storyId, // storyId is available if needed for context, but not saved on Character table directly
  onSave,
  onCancel,
}) => {
  const { supabase, user } = useAuth();
  const { createNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Combined uploadError into error
  // Removed isRedirecting
  const [fieldsReadOnly, setFieldsReadOnly] = useState(false);
  const [thumbnailGenerated, setThumbnailGenerated] = useState(false);
  // Removed retryCount as it's not part of the core logic from snippet
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    age?: string;
    description?: string;
    image?: string;
  }>({});
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    age: '',
    description: { es: '', en: '' }, // Ensure description is object
    reference_urls: [],
    thumbnail_url: null, // Match DB field name
  });

  // Use propCharacterId if available, otherwise generate a new UUID for the current session.
  // This ID is used for image uploads before the character is saved.
  const [currentCharacterId, setCurrentCharacterId] = useState<string>(propCharacterId || uuidv4());
  
  const isEditMode = !!propCharacterId;

  useEffect(() => {
    // If propCharacterId changes (e.g. parent re-renders with new ID), update internal ID
    if (propCharacterId) {
      setCurrentCharacterId(propCharacterId);
    } else {
      // If propCharacterId is null/undefined (create mode), ensure a new UUID is set for this form session
      setCurrentCharacterId(uuidv4());
    }
  }, [propCharacterId]);

  const uploadImageToStorage = async (file: File, charIdToUse: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    // Use charIdToUse (which is currentCharacterId: prop-based or new UUID) for the path
    const filePath = `reference-images/${user.id}/${charIdToUse}/${fileName}`;

    const { error: uploadErrorResponse, data } = await supabase.storage
      .from('storage') // Assuming 'storage' is your bucket name
      .upload(filePath, file);

    if (uploadErrorResponse) throw uploadErrorResponse;

    const { data: { publicUrl } } = supabase.storage
      .from('storage') // Assuming 'storage' is your bucket name
      .getPublicUrl(filePath);

    return publicUrl;
  };

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
          name: formData.name,
          age: formData.age,
          description: typeof formData.description === 'object' ? formData.description.es : formData.description,
          imageUrl: formData.reference_urls?.[0] || null
        })
      });

      if (!response.ok) {
        if (response.status === 429) { // Rate limit
          throw new Error('Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.');
        }
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido al analizar.' }));
        throw new Error(errorData.error || 'Error al analizar el personaje.');
      }
      return await response.json();
    } catch (error: any) {
      if (attempt < 2) { // Max 3 attempts (0, 1, 2)
        const backoffTime = Math.pow(2, attempt) * 1000; // 1s, 2s
        await sleep(backoffTime);
        return callAnalyzeCharacter(attempt + 1);
      }
      throw error; // Rethrow after max attempts
    }
  };

  useEffect(() => {
    // Load character data if in edit mode
    if (isEditMode && propCharacterId) {
      const loadCharacter = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const { data, error: fetchError } = await supabase
            .from('characters')
            .select('*')
            .eq('id', propCharacterId)
            .single();

          if (fetchError) throw fetchError;
          if (data) {
            setFormData({
              name: data.name,
              age: data.age,
              description: data.description || { es: '', en: '' },
              reference_urls: data.reference_urls || [],
              thumbnail_url: data.thumbnail_url,
            });
            if (data.thumbnail_url) {
              setThumbnailGenerated(true);
            }
          }
        } catch (err: any) {
          console.error('Error loading character:', err);
          setError(`Error al cargar el personaje: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      loadCharacter();
    } else {
      // Reset form for new character
      setFormData({
        name: '',
        age: '',
        description: { es: '', en: '' },
        reference_urls: [],
        thumbnail_url: null,
      });
      setThumbnailGenerated(false);
      setError(null);
      setFieldErrors({});
      // Ensure currentCharacterId is a new UUID for new forms not receiving a propCharacterId
      if (!propCharacterId) {
        setCurrentCharacterId(uuidv4());
      }
    }
  }, [propCharacterId, supabase, isEditMode]); // Removed setCurrentCharacterId from deps to avoid loop on reset

  const generateThumbnail = async () => {
    if (!user) {
      setError('Debes iniciar sesión para generar una miniatura.');
      createNotification(NotificationType.SYSTEM_ERROR, 'Error de autenticación', 'No autenticado.', NotificationPriority.HIGH);
      return;
    }
    if (!canGenerateThumbnail()) {
      setError('Se requiere una descripción o una imagen de referencia para generar la miniatura.');
      return;
    }

    setFieldsReadOnly(true);
    setError(null);
    setIsAnalyzing(true); // Can be one state for both, or separate
    setIsGeneratingThumbnail(true);

    try {
      // Simplified: Call describe-and-sketch directly, assuming analyze-character logic is part of it or not strictly needed for thumbnail
      const thumbnailResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name?.trim(),
          age: formData.age?.trim(),
          description: typeof formData.description === 'object' ? formData.description : { es: formData.description, en: '' },
          referenceImage: formData.reference_urls?.[0] || null
        })
      });

      if (!thumbnailResponse.ok) {
        const errorData = await thumbnailResponse.json().catch(() => ({})); // Try to parse error, default to empty obj
        if (thumbnailResponse.status === 429) {
          throw new Error('Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.');
        }
        throw new Error(errorData.error || 'Error al generar la miniatura. Por favor, verifica los datos e intenta de nuevo.');
      }

      const thumbnailData = await thumbnailResponse.json();
      if (!thumbnailData || !thumbnailData.thumbnailUrl) {
        throw new Error('No se recibió una URL válida para la miniatura desde la función.');
      }

      // The function might return a base64 image or a URL to a temporary image.
      // Assuming it's a URL to an image that needs to be re-uploaded to our storage:
      const imageResponse = await fetch(thumbnailData.thumbnailUrl);
      const blob = await imageResponse.blob();
      
      // Use currentCharacterId (prop-based or new UUID) for the path
      const thumbnailPath = `thumbnails/${user.id}/${currentCharacterId}/${Date.now()}.png`; 
      
      const { error: uploadErrorResponse } = await supabase.storage // Renamed to avoid conflict in this scope
        .from('storage') 
        .upload(thumbnailPath, blob, {
          contentType: 'image/png',
          upsert: true 
        });

      if (uploadErrorResponse) { // check renamed variable
        throw new Error(`Error al subir la miniatura generada: ${uploadErrorResponse.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('storage') // Assuming 'storage' is your bucket name
        .getPublicUrl(thumbnailPath);

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      setThumbnailGenerated(true);
      createNotification(NotificationType.SYSTEM_SUCCESS, 'Miniatura generada', `Se ha generado la miniatura para ${formData.name}`, NotificationPriority.NORMAL);

    } catch (err: any) {
      console.error('Error generating thumbnail:', err);
      setError(err.message || 'Error desconocido al generar la miniatura.');
      createNotification(NotificationType.SYSTEM_ERROR, 'Error al Generar Miniatura', err.message, NotificationPriority.HIGH);
    } finally {
      setFieldsReadOnly(false);
      setIsAnalyzing(false);
      setIsGeneratingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (!thumbnailGenerated) {
      setError('Debes generar una miniatura antes de guardar el personaje.');
      return;
    }
    if (!user) {
      setError('Debes iniciar sesión para guardar el personaje.');
      return;
    }

    // Basic client-side validation
    let currentFieldErrors: typeof fieldErrors = {};
    if (!formData.name?.trim()) currentFieldErrors.name = "El nombre es requerido.";
    if (!formData.age?.trim()) currentFieldErrors.age = "La edad es requerida."; // Example: make age required
    if (typeof formData.description === 'object' ? !formData.description.es?.trim() : !formData.description?.trim()) {
      currentFieldErrors.description = "La descripción es requerida.";
    }
    setFieldErrors(currentFieldErrors);
    if (Object.keys(currentFieldErrors).length > 0) {
        setError("Por favor corrige los errores indicados en el formulario.");
        return;
    }

    setIsLoading(true);
    try {
      // Use currentCharacterId if propCharacterId is not set (i.e., for new characters)
      const idToSave = propCharacterId || currentCharacterId;

      const characterDataToSave: Omit<Character, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id: string, id: string } = {
        id: idToSave, // Ensure ID is included for upsert/insert
        name: formData.name || '',
        age: formData.age || '',
        description: typeof formData.description === 'string' 
          ? { es: formData.description, en: '' } 
          : formData.description || { es: '', en: '' },
        reference_urls: formData.reference_urls || [],
        thumbnail_url: formData.thumbnail_url,
        user_id: user.id,
      };

      let savedOrUpdatedCharacter: Character;

      if (isEditMode && propCharacterId) { // Edit mode - Update
        const { data, error: updateError } = await supabase
          .from('characters')
          .update(characterDataToSave) // Pass full object, Supabase ignores 'id' for matching here
          .eq('id', propCharacterId)   // Match by actual propCharacterId
          .select()
          .single();
        if (updateError) throw updateError;
        savedOrUpdatedCharacter = data as Character;
        createNotification(NotificationType.CHARACTER_GENERATION_COMPLETE, '¡Personaje actualizado!', `El personaje ${formData.name} ha sido actualizado con éxito.`, NotificationPriority.MEDIUM);
      } else { // Create mode - Insert
        // Ensure currentCharacterId (generated UUID for new char) is used for the ID
        const { data, error: insertError } = await supabase
          .from('characters')
          .insert({ ...characterDataToSave, id: currentCharacterId }) // Explicitly use currentCharacterId for new insert
          .select()
          .single();
        if (insertError) throw insertError;
        savedOrUpdatedCharacter = data as Character;
        createNotification(NotificationType.CHARACTER_GENERATION_COMPLETE, '¡Personaje creado!', `El personaje ${formData.name} ha sido creado con éxito.`, NotificationPriority.HIGH);
      }
      
      // Call the onSave prop with the full character object
      await onSave(savedOrUpdatedCharacter); 
      // Parent (CharactersStep) will handle closing modal and refreshing list.

    } catch (err: any) {
      console.error('Error saving character:', err);
      setError(`Error al guardar el personaje: ${err.message}`);
      createNotification(NotificationType.SYSTEM_ERROR, 'Error al Guardar Personaje', `Error: ${err.message}`, NotificationPriority.HIGH);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Removed max-w-2xl mx-auto for modal contexts
    <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            id="characterName" // Added id
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, name: undefined }));
            }}
            disabled={fieldsReadOnly}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'} ${fieldsReadOnly ? 'bg-gray-100' : ''}`}
            placeholder="Nombre del personaje"
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="characterAge" className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
          <input
            id="characterAge" // Added id
            type="text" // Consider type="number" or add validation for numeric input
            value={formData.age}
            onChange={(e) => {
              setFormData({ ...formData, age: e.target.value });
              if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, age: undefined }));
            }}
            disabled={fieldsReadOnly}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${fieldErrors.age ? 'border-red-500' : 'border-gray-300'} ${fieldsReadOnly ? 'bg-gray-100' : ''}`}
            placeholder="Edad del personaje"
          />
          {fieldErrors.age && <p className="mt-1 text-xs text-red-500">{fieldErrors.age}</p>}
        </div>

        <div>
          <label htmlFor="characterDescription" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            id="characterDescription" // Added id
            value={typeof formData.description === 'object' ? formData.description.es : formData.description}
            onChange={(e) => {
              setFormData({ 
                ...formData, 
                description: { 
                  es: e.target.value, 
                  en: (typeof formData.description === 'object' && formData.description?.en) || '' 
                } 
              });
              if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, description: undefined }));
            }}
            disabled={fieldsReadOnly}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${fieldErrors.description ? 'border-red-500' : 'border-gray-300'} ${fieldsReadOnly ? 'bg-gray-100' : ''}`}
            rows={3}
            placeholder="Describe al personaje..."
          />
          {fieldErrors.description && <p className="mt-1 text-xs text-red-500">{fieldErrors.description}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Referencia</label>
            <div {...getRootProps()} className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${fieldErrors.image ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-md ${fieldsReadOnly ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-purple-500'}`}>
              <input {...getInputProps()} disabled={fieldsReadOnly} />
              {formData.reference_urls?.[0] ? (
                <img src={formData.reference_urls[0]} alt="Referencia" className="max-h-48 object-contain rounded" />
              ) : isLoading && !isGeneratingThumbnail && !isAnalyzing ? ( // Show loader for image upload, not other processes
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              ) : (
                <div className="space-y-1 text-center">
                  <Upload className={`mx-auto h-12 w-12 ${fieldErrors.image ? 'text-red-400' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-600">Arrastra o selecciona una imagen</p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP hasta 5MB</p>
                </div>
              )}
            </div>
            {fieldErrors.image && !formData.reference_urls?.[0] && <p className="mt-1 text-xs text-red-500">{fieldErrors.image}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miniatura Generada</label>
            <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {formData.thumbnail_url ? (
                <img src={formData.thumbnail_url} alt="Miniatura" className="w-full h-full object-cover" />
              ) : isGeneratingThumbnail || isAnalyzing ? (
                <div className="text-center p-2">
                  <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-purple-600">
                    {isAnalyzing && !isGeneratingThumbnail ? 'Analizando...' : 'Generando miniatura...'}
                  </p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-sm text-gray-500">La miniatura aparecerá aquí</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {!thumbnailGenerated ? (
             <button
              type="button"
              onClick={generateThumbnail}
              disabled={isAnalyzing || isGeneratingThumbnail || fieldsReadOnly || !canGenerateThumbnail()}
              className={`w-full sm:w-auto flex-grow justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${ (isAnalyzing || isGeneratingThumbnail || fieldsReadOnly || !canGenerateThumbnail()) ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500' }`}
            >
              {isAnalyzing || isGeneratingThumbnail ? (
                <><Loader size={20} className="animate-spin mr-2" /> {isAnalyzing && !isGeneratingThumbnail ? 'Analizando...' : 'Generando...'}</>
              ) : (
                <><Wand2 size={20} className="mr-2" /> Generar Miniatura</>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || fieldsReadOnly} // isLoading covers the saving process
              className={`w-full sm:w-auto flex-grow justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${ (isLoading || fieldsReadOnly) ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500' }`}
            >
              {isLoading ? <><Loader size={20} className="animate-spin mr-2" /> Guardando...</> : (isEditMode ? 'Guardar Cambios' : 'Crear Personaje')}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel} // Use onCancel prop
            disabled={isLoading || isAnalyzing || isGeneratingThumbnail} // Disable if any async op is running
            className="w-full sm:w-auto justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
    </form>
    // Removed the outer div to allow form to fill modal space or be controlled by parent
  );
};

export default CharacterForm;
