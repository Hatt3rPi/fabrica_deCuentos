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
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    age?: string;
    description?: string;
    image?: string;
  }>({});
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    description: { es: '', en: '' },
    reference_urls: [] as string[],
    thumbnailUrl: null as string | null,
  });
  
  const isEditMode = Boolean(id);
  
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
      setFieldErrors(prev => ({ ...prev, image: undefined, description: undefined }));

      try {
        const file = acceptedFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('reference-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('reference-images')
          .getPublicUrl(filePath);

        setFormData(prev => ({
          ...prev,
          reference_urls: [...(prev.reference_urls || []), publicUrl]
        }));

        await generateThumbnail();
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Error al subir la imagen');
      } finally {
        setIsLoading(false);
      }
    }
  });

  const generateThumbnail = async () => {
    setIsGeneratingThumbnail(true);
    setUploadError(null);
    
    try {
      // Verificar si tenemos descripción o imagen antes de continuar
      if (!formData.description.es && !formData.reference_urls[0]) {
        setFieldErrors(prev => ({
          ...prev,
          description: !formData.description.es ? "Se requiere una descripción o una imagen" : undefined,
          image: !formData.reference_urls[0] ? "Se requiere una descripción o una imagen" : undefined
        }));
        return;
      }
      
      // Si tenemos imagen pero no descripción, usar una descripción genérica
      const descriptionToUse = formData.description.es || 
        `Personaje llamado ${formData.name} de ${formData.age} años`;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          age: formData.age,
          description: descriptionToUse,
          referenceImage: formData.reference_urls[0] || null
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        thumbnailUrl: data.thumbnailUrl,
        description: data.description || prev.description 
      }));
      
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      setUploadError(`Error al generar la miniatura: ${error.message}`);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos
    let errors: typeof fieldErrors = {};
    let isValid = true;
    
    if (!formData.name) {
      errors.name = "El nombre es obligatorio";
      isValid = false;
    }
    
    if (!formData.age) {
      errors.age = "La edad es obligatoria";
      isValid = false;
    }
    
    // Validar que al menos esté presente la descripción o la imagen
    if (!formData.description.es && !formData.reference_urls[0]) {
      errors.description = "Se requiere una descripción o una imagen";
      errors.image = "Se requiere una descripción o una imagen";
      isValid = false;
    }
    
    setFieldErrors(errors);
    
    if (!isValid) return;
    
    // Generar miniatura si no existe una
    if (!formData.thumbnailUrl) {
      try {
        await generateThumbnail();
      } catch (error) {
        // El error ya se maneja dentro de generateThumbnail
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      const characterData = {
        name: formData.name,
        age: formData.age,
        description: formData.description,
        reference_urls: formData.reference_urls,
        thumbnail_url: formData.thumbnailUrl,
      };

      if (isEditMode) {
        await updateCharacter(id, characterData);
      } else {
        await addCharacter(characterData);
      }

      setIsRedirecting(true);
      navigate('/nuevo-cuento/personajes');
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
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
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
            value={formData.age}
            onChange={(e) => {
              setFormData({ ...formData, age: e.target.value });
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
            value={formData.description.es}
            onChange={(e) => {
              setFormData({
                ...formData,
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
                {formData.reference_urls[0] ? (
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
            {fieldErrors.image && !formData.reference_urls[0] && (
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
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
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

        {(error || uploadError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error || uploadError}</p>
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