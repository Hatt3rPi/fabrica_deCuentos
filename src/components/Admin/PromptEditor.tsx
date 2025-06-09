import React, { useState } from 'react';
import { aiProviderCatalog } from '../../constants/aiProviderCatalog';
import ModelBadge from '../UI/ModelBadge';
import { getModelType } from '../../utils/modelHelpers';

interface Props {
  initialType?: string;
  initialContent?: string;
  initialEndpoint?: string;
  initialModel?: string;
  onSave: (type: string, content: string, endpoint: string, model: string) => void;
}

const PromptEditor: React.FC<Props> = ({ initialType = '', initialContent = '', initialEndpoint = '', initialModel = 'gpt-4o', onSave }) => {
  const [type, setType] = useState(initialType);
  const [content, setContent] = useState(initialContent);
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [model, setModel] = useState(initialModel);

  // Obtener endpoints disponibles para el modelo seleccionado
  const getEndpointsForModel = (modelId: string): string[] => {
    for (const [, info] of Object.entries(aiProviderCatalog)) {
      if (info.models[modelId]) {
        return Object.values(info.models[modelId].endpoints).filter(Boolean) as string[];
      }
    }
    return [];
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    const endpoints = getEndpointsForModel(newModel);
    if (endpoints.length > 0 && !endpoints.includes(endpoint)) {
      setEndpoint(endpoints[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !content || !endpoint) return;
    onSave(type, content, endpoint, model);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
          placeholder="Ej: PROMPT_GENERADOR_CUENTOS"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Contenido</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Modelo</label>
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
        >
          {Object.entries(aiProviderCatalog).map(([provider, info]) => (
            <optgroup key={provider} label={info.name}>
              {Object.entries(info.models).map(([modelId, modelInfo]) => (
                <option key={modelId} value={modelId}>
                  {modelInfo.description}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="mt-1">
          <ModelBadge type={getModelType(model)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Endpoint</label>
        <select
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
        >
          {getEndpointsForModel(model).map(url => (
            <option key={url} value={url}>{url}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">
        Guardar
      </button>
    </form>
  );
};

export default PromptEditor;
