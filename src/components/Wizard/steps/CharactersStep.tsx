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

const CharactersStep: React.FC = () => {
  const { characters, setCharacters } = useWizard();
  const { supabase, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCharacters: setStoreCharacters } = useCharacterStore();

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
    const filePath = `reference-images/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('characters')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('characters')
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

      // Actualizar el store global
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
            description: '',
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
        // Eliminar imágenes del storage
        const character = characters.find(c => c.id === id);
        if (character?.reference_urls?.length) {
          for (const url of character.reference_urls) {
            const path = url.split('/').pop();
            if (path) {
              await supabase.storage
                .from('characters')
                .remove([`reference-images/${id}/${path}`]);
            }
          }
        }

        // Eliminar registro de la base de datos
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
    try {
      const { error } = await supabase
        .from('characters')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      const updatedCharacters = characters.map((character) =>
        character.id === id ? { ...character, ...updates } : character
      );
      setCharacters(updatedCharacters);
      setStoreCharacters(updatedCharacters);
    } catch (error) {
      console.error('Error updating character:', error);
    }
  };

  // Resto del componente sin cambios...
  // (El JSX y demás lógica de renderizado se mantiene igual)
});

export default CharactersStep;