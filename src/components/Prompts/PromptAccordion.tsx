import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '../UI/Button';
import { Prompt } from '../../types/prompts';

interface PromptAccordionProps {
  prompt: Prompt;
  onSave: (content: string, endpoint: string, model: string) => Promise<void> | void;
}

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const formatRelativeTime = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  const sec = diff / 1000;
  const abs = Math.abs(sec);
  if (abs < 60) return rtf.format(Math.round(sec), 'second');
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(sec / 86400), 'day');
  if (abs < 31536000) return rtf.format(Math.round(sec / 2592000), 'month');
  return rtf.format(Math.round(sec / 31536000), 'year');
};

const PromptAccordion: React.FC<PromptAccordionProps> = ({ prompt, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(prompt.content);
  const [endpoint, setEndpoint] = useState(prompt.endpoint || '');
  const [model, setModel] = useState(prompt.model || 'gpt-image-1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setContent(prompt.content);
    setEndpoint(prompt.endpoint || '');
    setModel(prompt.model || 'gpt-image-1');
  }, [prompt.content, prompt.endpoint, prompt.model]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(content, endpoint, model);
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="border rounded">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
      >

        <span className="text-left">
          <span className="font-bold">{prompt.type}</span>{' '}
          <span className="text-sm italic font-normal">
            (v{prompt.version}, modificado {formatRelativeTime(prompt.updated_at)})
          </span>

        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 space-y-4">
          {isEditing ? (
            <>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <input
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Endpoint"
              />
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="gpt-image-1">GPT-4 Vision</option>
                <option value="dall-e-3">DALL-E 3</option>
                <option value="dall-e-2">DALL-E 2</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="stable-diffusion-3.5">Stable Diffusion 3.5</option>
              </select>
            </>
          ) : (
            <>
              <pre className="whitespace-pre-wrap text-sm">{prompt.content}</pre>
              <p className="text-xs text-gray-500">
                Endpoint: <code>{prompt.endpoint}</code> | Modelo: {prompt.model}
              </p>
            </>
          )}
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setContent(prompt.content);
                    setEndpoint(prompt.endpoint || '');
                    setModel(prompt.model || 'gpt-image-1');
                  }}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} isLoading={isSaving}>
                  Guardar
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptAccordion;
