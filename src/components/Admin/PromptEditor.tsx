import React, { useState } from 'react';

interface Props {
  initialType?: string;
  initialContent?: string;
  initialEndpoint?: string;
  initialModel?: string;
  onSave: (type: string, content: string, endpoint: string, model: string) => void;
}

const PromptEditor: React.FC<Props> = ({ initialType = '', initialContent = '', initialEndpoint = '', initialModel = 'gpt-image-1', onSave }) => {
  const [type, setType] = useState(initialType);
  const [content, setContent] = useState(initialContent);
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [model, setModel] = useState(initialModel);

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
        <label className="block text-sm font-medium text-gray-700">Endpoint</label>
        <input
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Modelo</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
        >
          <option value="gpt-image-1">GPT-4 Vision</option>
          <option value="dall-e-3">DALL-E 3</option>
          <option value="dall-e-2">DALL-E 2</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="stable-diffusion-3.5">Stable Diffusion 3.5</option>
        </select>
      </div>
      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">
        Guardar
      </button>
    </form>
  );
};

export default PromptEditor;
