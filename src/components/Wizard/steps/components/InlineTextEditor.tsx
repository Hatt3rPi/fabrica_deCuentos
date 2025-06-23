import React, { useRef, useEffect } from 'react';
import { Check, X, AlertCircle, Loader } from 'lucide-react';
import { useRealTimeEditor } from '../../../../hooks/useRealTimeEditor';
import type { InlineTextEditorProps } from '../../../../types/editor';

const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  initialText,
  onSave,
  config,
  textStyles = {},
  className = '',
  disabled = false,
  onEditStart,
  onEditEnd
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    editState,
    localText,
    isEditing,
    hasUnsavedChanges,
    errorMessage,
    startEditing,
    updateText,
    saveText,
    cancelEditing,
    clearError
  } = useRealTimeEditor(initialText, onSave, config);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && isEditing) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localText, isEditing]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Callbacks para inicio y fin de edición
  useEffect(() => {
    if (isEditing && onEditStart) {
      onEditStart();
    } else if (!isEditing && onEditEnd) {
      onEditEnd();
    }
  }, [isEditing, onEditStart, onEditEnd]);

  const handleDoubleClick = () => {
    if (!disabled && !isEditing) {
      startEditing();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateText(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !config?.multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleBlur = () => {
    // Auto-save al salir del campo si hay cambios
    if (hasUnsavedChanges) {
      saveText().catch(console.error);
    }
    // No salir de modo edición automáticamente para permitir multiple cambios
  };

  const handleSave = async () => {
    try {
      await saveText();
      // Note: isEditing state is managed by the hook, not directly here
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleCancel = () => {
    cancelEditing();
  };

  // Determinar clases CSS basadas en estado
  const getStateClasses = () => {
    const baseClasses = 'transition-all duration-200';
    
    if (disabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed`;
    }
    
    if (!isEditing) {
      return `${baseClasses} cursor-pointer hover:bg-black/5 hover:ring-1 hover:ring-purple-300 rounded`;
    }
    
    switch (editState) {
      case 'editing':
        return `${baseClasses} border-2 border-yellow-400 shadow-md`;
      case 'saving':
        return `${baseClasses} border-2 border-blue-400 shadow-md`;
      case 'saved':
        return `${baseClasses} border-2 border-green-400 shadow-md`;
      case 'error':
        return `${baseClasses} border-2 border-red-400 shadow-md`;
      default:
        return baseClasses;
    }
  };

  // Renderizar indicador de estado
  const renderStateIndicator = () => {
    if (!config?.showIndicators || !isEditing) return null;

    const indicators = {
      saving: <Loader className="w-4 h-4 animate-spin text-blue-600" />,
      saved: <Check className="w-4 h-4 text-green-600" />,
      error: <AlertCircle className="w-4 h-4 text-red-600" />
    };

    const indicator = indicators[editState as keyof typeof indicators];
    if (!indicator) return null;

    return (
      <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm">
        {indicator}
      </div>
    );
  };

  // Renderizar botones de acción
  const renderActionButtons = () => {
    if (!isEditing) return null;

    return (
      <div className="absolute bottom-1 right-1 flex gap-1">
        <button
          onClick={handleCancel}
          className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          title="Cancelar (Esc)"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || editState === 'saving'}
          className="p-1 rounded bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Guardar (Ctrl+S)"
        >
          <Check className="w-3 h-3 text-purple-600" />
        </button>
      </div>
    );
  };

  if (!isEditing) {
    // Modo vista - mostrar texto estático
    return (
      <div className="relative group">
        <div
          className={`${getStateClasses()} ${className} px-2 py-1 min-h-[1.5rem] relative`}
          style={textStyles}
          onDoubleClick={handleDoubleClick}
          title={disabled ? undefined : config?.placeholder}
        >
          {localText || config?.placeholder}
          
          {/* Tooltip de instrucción */}
          {!disabled && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Doble-click para editar
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modo edición - mostrar textarea
  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`${getStateClasses()} ${className} w-full p-2 resize-none overflow-hidden outline-none rounded`}
        style={{
          ...textStyles,
          minHeight: '2.5rem',
          lineHeight: textStyles.lineHeight || '1.4'
        }}
        placeholder={config?.placeholder}
        disabled={disabled || editState === 'saving'}
      />
      
      {renderStateIndicator()}
      {renderActionButtons()}
      
      {/* Error message */}
      {errorMessage && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 max-w-xs z-10">
          <div className="flex items-start gap-1">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Error:</span> {errorMessage}
              <button
                onClick={clearError}
                className="ml-2 text-red-500 hover:text-red-700 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Indicador de cambios no guardados */}
      {hasUnsavedChanges && editState !== 'saving' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-white" 
             title="Cambios no guardados" />
      )}
    </div>
  );
};

export default InlineTextEditor;