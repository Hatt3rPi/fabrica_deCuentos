import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCharacterStore } from '../../stores/characterStore';
import Button from '../UI/Button';

const CharacterForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { supabase } = useAuth();
  const { addCharacter, updateCharacter, characters } = useCharacterStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [character, setCharacter] = useState({
    name: '',
    age: '',
    description: { es: '', en: '' },
    reference_urls: [] as string[],
  });

  useEffect(() => {
    if (id) {
      const existingCharacter = characters.find(c => c.id === id);
      if (existingCharacter) {
        setCharacter(existingCharacter);
      }
    }
  }, [id, characters]);

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

    const description = typeof character.description === 'object' 
      ? character.description.es 
      : character.description;

    if (!character.name?.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!character.age?.trim()) {
      setError('La edad es obligatoria');
      return;
    }

    if (!description?.trim() && (!character.reference_urls || character.reference_urls.length === 0)) {
      setError('Debes proporcionar una descripción o una imagen');
      return;
    }

    try {
      if (id) {
        const { error } = await supabase
          .from('characters')
          .update(character)
          .eq('id', id);

        if (error) throw error;
        updateCharacter(id, character);
      } else {
        const { data, error } = await supabase
          .from('characters')
          .insert([character])
          .select()
          .single();

        if (error) throw error;
        if (data) addCharacter(data);
      }

      navigate('/nuevo-cuento/personajes');
    } catch (err) {
      setError('Error al guardar el personaje');
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-8 text-center">
        {id ? 'Editar personaje' : 'Crear nuevo personaje'}
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
            aria-required="true"
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
            aria-required="true"
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
            {(!character.reference_urls || character.reference_urls.length < 3) && (
              <div
                {...getRootProps()}
                className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-purple-500"
              >
                <input {...getInputProps()} />
                {isLoading ? (
                  <Loader className="w-6 h-6 text-purple-600 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2" role="alert">
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