import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCharacterStore } from '../../stores/characterStore';

const CharacterForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { supabase } = useAuth();
  const { addCharacter, updateCharacter, characters } = useCharacterStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    age?: string;
    description?: string;
    image?: string;
  }>({});
  const [character, setCharacter] = useState({
    id: '',
    user_id: '',
    name: '',
    age: '',
    description: { es: '', en: '' },
    reference_urls: [] as string[],
    thumbnailUrl: null as string | null,
    images: [] as string[],
  });
  
  const isEditMode = Boolean(id);
  
  // Load character data when in edit mode
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
            setCharacter(data);
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
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      setIsLoading(true);
      setError(null);
      // Clear any image field errors
      setFieldErrors(prev => ({ ...prev, image: undefined, description: undefined }));

      try {
        const file = acceptedFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `reference-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('characters')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('characters')
          .getPublicUrl(filePath);

        setCharacter(prev => ({
          ...prev,
          reference_urls: [...(prev.reference_urls || []), publicUrl]
        }));

        // Generate thumbnail after upload
        await generateThumbnail(publicUrl);
      } catch (err) {
        setError('Error al subir la imagen');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  });

  const generateThumbnail = async (imageUrl: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: character.name,
          age: character.age,
          description: typeof character.description === 'object' ? character.description.es : character.description,
          referenceImage: imageUrl
        })
      });

      if (!response.ok) throw new Error('Error generando miniatura');
      
      const data = await response.json();
      setCharacter(prev => ({
        ...prev,
        thumbnailUrl: data.thumbnailUrl
      }));
    } catch (err) {
      setError('Error al generar la miniatura');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let fieldValidationErrors: {
      name?: string;
      age?: string;
      description?: string;
      image?: string;
    } = {};

    // Validation
    if (!character.name?.trim()) {
      fieldValidationErrors.name = 'El nombre es obligatorio';
    }

    if (!character.age?.trim()) {
      fieldValidationErrors.age = 'La edad es obligatoria';
    }

    const description = typeof character.description === 'object' 
      ? character.description.es 
      : character.description;

    if (!description?.trim() && (!character.reference_urls || character.reference_urls.length === 0)) {
      fieldValidationErrors.description = 'Debes proporcionar una descripción o una imagen';
      fieldValidationErrors.image = 'Debes proporcionar una descripción o una imagen';
    }

    // Check if there are validation errors
    if (Object.keys(fieldValidationErrors).length > 0) {
      setFieldErrors(fieldValidationErrors);
      setError('Por favor corrige los errores antes de continuar');
      return;
    }

    setIsLoading(true);

    try {
      let data;
      
      if (isEditMode) {
        // Update existing character
        const { data: updatedData, error } = await supabase
          .from('characters')
          .update({
            name: character.name,
            age: character.age,
            description: character.description,
            reference_urls: character.reference_urls,
            thumbnailUrl: character.thumbnailUrl,
            images: character.images
          })
          .eq('id', character.id)
          .select()
          .single();

        if (error) throw error;
        data = updatedData;
        
        if (data) {
          updateCharacter(character.id, data);
        }
      } else {
        // Create new character
        const { data: newData, error } = await supabase
          .from('characters')
          .insert([{
            ...character,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }])
          .select()
          .single();

        if (error) throw error;
        data = newData;
        
        if (data) {
          addCharacter(data);
        }
      }
      
      setIsRedirecting(true);
      
      // Wait 1 second before redirecting
      setTimeout(() => {
        navigate('/nuevo-cuento/personajes');
      }, 1000);
    } catch (err) {
      setError(`Error al ${isEditMode ? 'actualizar' : 'guardar'} el personaje`);
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-8">
        {isEditMode ? 'Editar Personaje' : 'Personaje de tu Historia'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={character.name}
            onChange={(e) => {
              setCharacter({ ...character, name: e.target.value });
              if (e.target.value.trim()) {
                setFieldErrors(prev => ({ ...prev, name: undefined }));
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              fieldErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
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
            value={character.age}
            onChange={(e) => {
              setCharacter({ ...character, age: e.target.value });
              if (e.target.value.trim()) {
                setFieldErrors(prev => ({ ...prev, age: undefined }));
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              fieldErrors.age ? 'border-red-500' : 'border-gray-300'
            }`}
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
            value={
              typeof character.description === 'object'
                ? character.description.es
                : character.description
            }
            onChange={(e) => {
              setCharacter({
                ...character,
                description: { es: e.target.value, en: '' }
              });
              if (e.target.value.trim()) {
                setFieldErrors(prev => ({ ...prev, description: undefined }));
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              fieldErrors.description ? 'border-red-500' : 'border-gray-300'
            }`}
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
              <div className={`w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 ${
                fieldErrors.image ? 'border-red-500' : 'border-gray-300'
              }`}>
                {character.reference_urls?.[0] ? (
                  <img
                    src={character.reference_urls[0]}
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
            {fieldErrors.image && !character.reference_urls?.[0] && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.image}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miniatura generada
            </label>
            <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {character.thumbnailUrl ? (
                <img
                  src={character.thumbnailUrl}
                  alt="Miniatura"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center p-4">
                  <p className="text-sm text-gray-500">
                    La miniatura se generará automáticamente
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
          <button
            type="submit"
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

          <button
            type="button"
            onClick={() => navigate('/nuevo-cuento/personajes')}
            className="flex-1 py-3 px-4 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterForm;