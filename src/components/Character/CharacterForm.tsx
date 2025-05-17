import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader, AlertCircle, Wand2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Character } from '../../types';
import Button from '../UI/Button';
import StepIndicator from '../Wizard/StepIndicator';

interface CharacterFormProps {
  character?: Partial<Character>;
}

const CharacterForm: React.FC<CharacterFormProps> = ({ character }) => {
  const navigate = useNavigate();
  const { storyId } = useParams();
  const { supabase, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [thumbnailGenerated, setThumbnailGenerated] = useState(false);
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    age: '',
    description: { es: '', en: '' },
    reference_urls: [],
    thumbnailUrl: null,
  });

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
      
      const characterId = crypto.randomUUID();
      const characterData = {
        id: characterId,
        user_id: user.id,
        name: formData.name,
        age: formData.age,
        description: formData.description,
        reference_urls: formData.reference_urls,
        thumbnail_url: formData.thumbnailUrl,
      };

      const { error: characterError } = await supabase
        .from('characters')
        .insert(characterData);

      if (characterError) throw characterError;

      const { error: relationError } = await supabase
        .from('story_characters')
        .insert({
          story_id: storyId,
          character_id: characterId
        });

      if (relationError) throw relationError;

      navigate(`/wizard/${storyId}`);
    } catch (err) {
      console.error('Error saving character:', err);
      setError('Error al guardar el personaje');
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const file = acceptedFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `reference-images/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('storage')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('storage')
          .getPublicUrl(filePath);

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

  const generateThumbnail = async () => {
    if (!formData.name?.trim() || !formData.age?.trim()) {
      setError('El nombre y la edad son obligatorios');
      return;
    }

    if (!formData.description?.es && !formData.reference_urls?.[0]) {
      setError('Se requiere una descripción o una imagen de referencia');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/describe-and-sketch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          age: formData.age,
          description: formData.description?.es,
          referenceImage: formData.reference_urls?.[0]
        })
      });

      if (!response.ok) throw new Error('Error al generar la miniatura');

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: data.thumbnailUrl
      }));

      setThumbnailGenerated(true);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setError('Error al generar la miniatura');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <StepIndicator />
      
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Edad del personaje"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description?.es}
              onChange={(e) => setFormData({
                ...formData,
                description: { es: e.target.value, en: '' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Describe al personaje..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen de referencia
              </label>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500">
                  {formData.reference_urls?.[0] ? (
                    <img
                      src={formData.reference_urls[0]}
                      alt="Referencia"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Arrastra una imagen o haz clic para seleccionar
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
                ) : isAnalyzing ? (
                  <div className="text-center">
                    <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-purple-600">Generando miniatura...</p>
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
              <Button
                onClick={generateThumbnail}
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generar miniatura</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar personaje</span>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterForm;