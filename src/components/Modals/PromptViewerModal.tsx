import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { promptService } from '../../services/promptService';

interface PromptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromptViewerModal: React.FC<PromptViewerModalProps> = ({ isOpen, onClose }) => {
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [descriptionPrompt, setDescriptionPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadPrompts = async () => {
      setIsLoading(true);
      try {
        const [thumb, desc] = await Promise.all([
          promptService.getPrompt('PROMPT_CREAR_MINIATURA_PERSONAJE'),
          promptService.getPrompt('PROMPT_DESCRIPCION_PERSONAJE')
        ]);
        setThumbnailPrompt(thumb?.content || '');
        setDescriptionPrompt(desc?.content || '');
      } catch (err) {
        console.error('Error loading prompts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompts();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[600px] overflow-auto max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Prompts actuales</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {isLoading ? (
            <p>Cargando...</p>
          ) : (
            <>
              <div>
                <h3 className="font-semibold mb-2">PROMPT_CREAR_MINIATURA_PERSONAJE</h3>
                <textarea
                  readOnly
                  value={thumbnailPrompt}
                  rows={6}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-2">PROMPT_DESCRIPCION_PERSONAJE</h3>
                <textarea
                  readOnly
                  value={descriptionPrompt}
                  rows={6}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptViewerModal;
