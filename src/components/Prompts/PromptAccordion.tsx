import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '../UI/Button';
import { Prompt } from '../../types/prompts';
import { aiProviderCatalog } from '../../constants/aiProviderCatalog';
import ModelBadge from '../UI/ModelBadge';
import { getModelType, isCompatibleModel } from '../../utils/modelHelpers';
import { promptEdgeMap } from '../../constants/promptEdgeMap';
import { openaiQualityOptions, openaiSizeOptions } from '../../constants/imageOptions';
import { edgeFunctionColorMap } from '../../constants/edgeFunctionColors';

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
  const [model, setModel] = useState(prompt.model || 'gpt-4o');
  const [isSaving, setIsSaving] = useState(false);
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [width, setWidth] = useState('1024');
  const [height, setHeight] = useState('1024');
  const edgeFunctions = promptEdgeMap[prompt.type] || [];

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
    const provider = modelToProvider[model];
    if (provider === 'openai') {
      setSize(openaiSizeOptions[model]?.[0] || '1024x1024');
      setQuality(openaiQualityOptions[model]?.[0] || 'standard');
    } else if (provider === 'flux') {
      setWidth('1024');
      setHeight('1024');
    }
  }, [model, modelToProvider]);

  // Filtrar modelos compatibles con el tipo de prompt
  const compatibleModels = React.useMemo(() => {
    const models: { provider: string; modelId: string; description: string }[] = [];
    Object.entries(aiProviderCatalog).forEach(([provider, info]) => {
      Object.entries(info.models).forEach(([modelId, modelInfo]) => {
        if (isCompatibleModel(modelId, prompt.type)) {
          models.push({
            provider,
            modelId,
            description: modelInfo.description
          });
        }
      });
    });
    return models;
  }, [prompt.type]);

  useEffect(() => {
    setContent(prompt.content);
    setEndpoint(prompt.endpoint || '');
    setModel(prompt.model || 'gpt-4o');
    setSize('1024x1024');
    setQuality('standard');
    setWidth('1024');
    setHeight('1024');
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

        <span className="text-left flex flex-col gap-1">
          <span>
            <span className="font-bold">{prompt.type}</span>{' '}
            <span className="text-sm italic font-normal">
              (v{prompt.version}, modificado {formatRelativeTime(prompt.updated_at)})
            </span>
          </span>
          {edgeFunctions.length > 0 && (
            <span className="flex flex-wrap gap-1 mt-1">
              {edgeFunctions.map((e) => (
                <span
                  key={e}
                  className={`${edgeFunctionColorMap[e]?.base || 'bg-indigo-100 text-indigo-800'} text-xs px-2 py-0.5 rounded`}
                >
                  {e}
                </span>
              ))}
            </span>
          )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
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
                  {Object.entries(aiProviderCatalog).map(([provider, info]) => {
                    const providerModels = compatibleModels.filter(m => m.provider === provider);
                    if (providerModels.length === 0) return null;
                    
                    return (
                      <optgroup key={provider} label={info.name}>
                        {providerModels.map((m) => (
                          <option key={m.modelId} value={m.modelId}>
                            {m.description} {' '}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <div className="mt-1">
                  <ModelBadge type={getModelType(model)} />
                </div>
              </div>
              {endpointOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                  <select
                    value={endpoint}
                    onChange={e => setEndpoint(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    {endpointOptions.map(url => (
                      <option key={url} value={url}>{url}</option>
                    ))}
                  </select>
                </div>
              )}
              {getModelType(model) === 'image' && (
                <div className="grid grid-cols-2 gap-2">
                  {modelToProvider[model] === 'openai' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                        <select
                          value={size}
                          onChange={e => setSize(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        >
                          {openaiSizeOptions[model]?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calidad</label>
                        <select
                          value={quality}
                          onChange={e => setQuality(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        >
                          {openaiQualityOptions[model]?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ancho</label>
                        <input
                          type="number"
                          value={width}
                          onChange={e => setWidth(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alto</label>
                        <input
                          type="number"
                          value={height}
                          onChange={e => setHeight(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <pre className="whitespace-pre-wrap text-sm">{prompt.content}</pre>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <p>
                  Endpoint: <code>{prompt.endpoint}</code> | Modelo: {prompt.model}
                </p>
                <ModelBadge type={getModelType(prompt.model || 'gpt-4o')} />
              </div>
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
                  setModel(prompt.model || 'gpt-4o');
                  setSize('1024x1024');
                  setQuality('standard');
                  setWidth('1024');
                  setHeight('1024');
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
