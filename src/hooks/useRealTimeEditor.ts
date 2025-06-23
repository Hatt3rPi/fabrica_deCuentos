import { useState, useEffect, useCallback, useRef } from 'react';
import { debounceAsync } from '../utils/debounce';
import type { 
  EditState, 
  RealTimeEditorConfig, 
  UseRealTimeEditorReturn 
} from '../types/editor';

const DEFAULT_CONFIG: RealTimeEditorConfig = {
  autoSaveDelay: 2000, // 2 segundos
  showIndicators: true,
  multiline: false,
  placeholder: 'Hacer doble-click para editar...'
};

/**
 * Hook para edición en tiempo real con auto-save
 */
export const useRealTimeEditor = (
  initialText: string,
  onSave: (text: string) => Promise<void>,
  config: Partial<RealTimeEditorConfig> = {}
): UseRealTimeEditorReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Estados
  const [editState, setEditState] = useState<EditState>('idle');
  const [localText, setLocalText] = useState(initialText);
  const [originalText, setOriginalText] = useState(initialText);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Referencias
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSaveRef = useRef<ReturnType<typeof debounceAsync> | null>(null);

  // Computed states
  const hasUnsavedChanges = localText !== originalText;

  // Crear función de guardado con debounce
  useEffect(() => {
    debouncedSaveRef.current = debounceAsync(async (text: string) => {
      if (text === originalText) {
        return; // No hay cambios reales
      }

      setEditState('saving');
      setErrorMessage(undefined);

      try {
        await onSave(text);
        setOriginalText(text);
        setEditState('saved');
        
        // Mostrar estado 'saved' por 2 segundos, luego volver a 'idle'
        setTimeout(() => {
          setEditState(prev => prev === 'saved' ? 'idle' : prev);
        }, 2000);
      } catch (error) {
        setEditState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error al guardar');
        console.error('Error saving text:', error);
      }
    }, finalConfig.autoSaveDelay);

    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [onSave, originalText, finalConfig.autoSaveDelay]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Actualizar texto inicial cuando cambie externamente
  useEffect(() => {
    if (!isEditing && initialText !== originalText) {
      setLocalText(initialText);
      setOriginalText(initialText);
    }
  }, [initialText, isEditing, originalText]);

  // Acciones
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditState('editing');
    setErrorMessage(undefined);
  }, []);

  const updateText = useCallback((text: string) => {
    setLocalText(text);
    
    if (isEditing && debouncedSaveRef.current) {
      // Cancelar guardado anterior y programar nuevo
      debouncedSaveRef.current.cancel();
      debouncedSaveRef.current(text);
    }
  }, [isEditing]);

  const saveText = useCallback(async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    // Cancelar auto-save y guardar inmediatamente
    debouncedSaveRef.current?.cancel();
    
    setEditState('saving');
    setErrorMessage(undefined);

    try {
      await onSave(localText);
      setOriginalText(localText);
      setEditState('saved');
      
      setTimeout(() => {
        setEditState(prev => prev === 'saved' ? 'idle' : prev);
      }, 2000);
    } catch (error) {
      setEditState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error al guardar');
      throw error;
    }
  }, [localText, hasUnsavedChanges, onSave]);

  const cancelEditing = useCallback(() => {
    // Cancelar auto-save pendiente
    debouncedSaveRef.current?.cancel();
    
    // Revertir cambios
    setLocalText(originalText);
    setIsEditing(false);
    setEditState('idle');
    setErrorMessage(undefined);
  }, [originalText]);

  const clearError = useCallback(() => {
    setErrorMessage(undefined);
    setEditState('idle');
  }, []);

  return {
    // Estado
    editState,
    localText,
    originalText,
    isEditing,
    hasUnsavedChanges,
    errorMessage,
    
    // Acciones
    startEditing,
    updateText,
    saveText,
    cancelEditing,
    clearError
  };
};