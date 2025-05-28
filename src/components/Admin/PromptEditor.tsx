import React, { useState } from 'react';

interface Props {
  initialType?: string;
  initialContent?: string;
  onSave: (type: string, content: string) => void;
}

const PromptEditor: React.FC<Props> = ({ initialType = '', initialContent = '', onSave }) => {
  const [type, setType] = useState(initialType);
  const [content, setContent] = useState(initialContent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !content) return;
    onSave(type, content);
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
      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">
        Guardar
      </button>
    </form>
  );
};

export default PromptEditor;
