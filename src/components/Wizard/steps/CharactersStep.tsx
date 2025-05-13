import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useAuth } from '../../../context/AuthContext';
import { Upload, RefreshCw, Trash2, Plus, Loader, AlertCircle } from 'lucide-react';
import { Character } from '../../../types';
import Button from '../../UI/Button';

// ... (previous code remains the same until generateThumbnail function)

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

  // ... (rest of the code remains the same)

export default generateThumbnail