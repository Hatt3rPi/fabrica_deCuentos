import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCharacterStore } from '../../stores/characterStore';
import Button from '../UI/Button';

const CharacterForm: React.FC = () => {
  const navigate = useNavigate();
  const { supabase } = useAuth();
  const { addCharacter } = useCharacterStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [character, setCharacter] = useState({
    name: '',
    age: '',
    description: { es: '', en: '' },
    reference_urls: [] as string[],
  });

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
      } catch (err) {
        setError('Error al subir la imagen');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!character.name?.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!character.age?.trim()) {
      setError('La edad es obligatoria');
      return;
    }

    const description = typeof character.description === 'object' 
      ? character.description.es 
      : character.description;

    if (!description?.trim() && (!character.reference_urls || character.reference_urls.length === 0)) {
      setError('Debes proporcionar una descripción o una imagen');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('characters')
        .insert([character])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        addCharacter(data);
        navigate('/nuevo-cuento/personajes');
      }
    } catch (err) {
      setError('Error al guardar el personaje');
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-8">
        Personaje de tu Historia
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={character.name}
            onChange={(e) => setCharacter({ ...character, name: e.target.value })}
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
            onChange={(e) => setCharacter({ ...character, age: e.target.value })}
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
              setCharacter({
                ...character,
                description: { es: e.target.value, en: '' }
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Describe al personaje..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imagen de referencia
          </label>
          <div {...getRootProps()} className="mt-2">
            <input {...getInputProps()} />
            <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500">
              {isLoading ? (
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Arrastra una imagen o haz clic para seleccionar
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

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/nuevo-cuento/personajes')}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CharacterForm;