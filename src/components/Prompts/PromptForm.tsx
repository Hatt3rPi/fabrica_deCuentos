import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../UI/Button';

interface PromptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    type: string,
    content: string,
    endpoint: string,
    model: string
  ) => Promise<void> | void;
}

const PromptForm: React.FC<PromptFormProps> = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('gpt-image-1');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ type?: string; content?: string; endpoint?: string }>({});

  const handleSave = async () => {
    const errs: { type?: string; content?: string; endpoint?: string } = {};
    if (!type) errs.type = 'Requerido';
    if (!content) errs.content = 'Requerido';
    if (!endpoint) errs.endpoint = 'Requerido';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    await onSave(type, content, endpoint, model);
    setIsSaving(false);
    setType('');
    setContent('');
    setEndpoint('');
    setModel('gpt-image-1');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nuevo Prompt</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <input
              value={type}
              onChange={e => setType(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
            />
            {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contenido</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Endpoint</label>
            <input
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
            />
            {errors.endpoint && <p className="text-xs text-red-500">{errors.endpoint}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Modelo</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
            >
              <option value="gpt-image-1">GPT-4 Vision</option>
              <option value="dall-e-3">DALL-E 3</option>
              <option value="dall-e-2">DALL-E 2</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="stable-diffusion-3.5">Stable Diffusion 3.5</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptForm;
