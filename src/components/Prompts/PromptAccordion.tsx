import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '../UI/Button';
import { Prompt } from '../../types/prompts';
import { aiProviderCatalog } from '../../constants/aiProviderCatalog';

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

  const modelToProvider: Record<string, string> = React.useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(aiProviderCatalog).forEach(([provider, info]) => {
      Object.keys(info.models).forEach((m) => {
        map[m] = provider;
      });
    });
    return map;
  }, []);

  const endpointOptions = React.useMemo(() => {
    const provider = modelToProvider[model];
    if (!provider) return [] as string[];
    const modelInfo = aiProviderCatalog[provider as keyof typeof aiProviderCatalog].models[model];
    if (!modelInfo) return [] as string[];
    return Object.values(modelInfo.endpoints).filter(Boolean) as string[];
  }, [model, modelToProvider]);

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
              <select
                value={model}
                onChange={e => {
                  const val = e.target.value;
                  setModel(val);
                  const provider = modelToProvider[val];
                  const modelInfo = provider
                    ? aiProviderCatalog[provider as keyof typeof aiProviderCatalog].models[val]
                    : undefined;
                  const eps = modelInfo ? Object.values(modelInfo.endpoints).filter(Boolean) : [];
                  setEndpoint(eps[0] || '');
                }}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                {Object.entries(aiProviderCatalog).map(([provider, info]) => (
                  <optgroup key={provider} label={info.name}>
                    {Object.keys(info.models).map((m) => (
                      <option key={m} value={m}>{info.models[m].description}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {endpointOptions.length > 0 && (
                <select
                  value={endpoint}
                  onChange={e => setEndpoint(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  {endpointOptions.map(url => (
                    <option key={url} value={url}>{url}</option>
                  ))}
                </select>
              )}
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
