import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Eye, EyeOff, Type, Image } from 'lucide-react';
import type { AdvancedEditModalProps } from '../../../../types/editor';

const AdvancedEditModal: React.FC<AdvancedEditModalProps> = ({
  isOpen,
  onClose,
  pageData,
  onSave,
  onRegenerate,
  isRegenerating = false
}) => {
  const [localText, setLocalText] = useState(pageData.text);
  const [localPrompt, setLocalPrompt] = useState(pageData.prompt);
  const [activeTab, setActiveTab] = useState<'text' | 'prompt'>('text');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Reset local state when pageData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalText(pageData.text);
      setLocalPrompt(pageData.prompt);
      setHasChanges(false);
      setActiveTab('text');
      setShowPreview(false);
    }
  }, [isOpen, pageData]);

  // Track changes
  useEffect(() => {
    const textChanged = localText !== pageData.text;
    const promptChanged = localPrompt !== pageData.prompt;
    setHasChanges(textChanged || promptChanged);
  }, [localText, localPrompt, pageData]);

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const updates: { text?: string; prompt?: string } = {};
      
      if (localText !== pageData.text) {
        updates.text = localText;
      }
      if (localPrompt !== pageData.prompt) {
        updates.prompt = localPrompt;
      }

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      // TODO: Show error notification
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (localPrompt === pageData.prompt && !hasChanges) {
      // Use current prompt
      await onRegenerate(pageData.prompt);
    } else if (localPrompt !== pageData.prompt) {
      // Save prompt first, then regenerate
      try {
        setIsSaving(true);
        await onSave({ prompt: localPrompt });
        await onRegenerate(localPrompt);
        onClose();
      } catch (error) {
        console.error('Error regenerating:', error);
        // TODO: Show error notification
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const isTitle = pageData.pageNumber === 0;
  const pageLabel = isTitle ? 'Portada' : `Página ${pageData.pageNumber}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Editor Avanzado - {pageLabel}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Edita el contenido y prompt de la página
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'text'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Type className="w-4 h-4" />
            Texto
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'prompt'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Image className="w-4 h-4" />
            Prompt de Imagen
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col p-6">
            {activeTab === 'text' ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    {isTitle ? 'Título del cuento' : 'Texto de la página'}
                  </label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPreview ? 'Ocultar' : 'Vista previa'}
                  </button>
                </div>
                <textarea
                  value={localText}
                  onChange={(e) => setLocalText(e.target.value)}
                  className="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={isTitle ? 'Escribe el título del cuento...' : 'Escribe el texto de la página...'}
                />
                {showPreview && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                    <div className="whitespace-pre-wrap text-gray-800">
                      {localText || 'Sin contenido...'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Prompt para la imagen
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Describe cómo quieres que se vea la imagen. Sé específico con detalles, colores y estilo.
                  </p>
                </div>
                <textarea
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  className="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe la imagen que quieres generar..."
                />
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> Incluye detalles como el estilo artístico, la iluminación, los colores y la composición para obtener mejores resultados.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel (opcional) */}
          {pageData.imageUrl && (
            <div className="w-1/3 border-l border-gray-200 p-6 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Imagen actual
              </p>
              <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
                <img
                  src={pageData.imageUrl}
                  alt={`${pageLabel} actual`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {hasChanges && (
              <>
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                Cambios no guardados
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            
            {activeTab === 'prompt' && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRegenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isRegenerating ? 'Regenerando...' : 'Regenerar Imagen'}
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedEditModal;