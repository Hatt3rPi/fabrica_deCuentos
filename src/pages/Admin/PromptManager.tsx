import React from 'react';
import { usePromptManager } from '../../hooks/usePromptManager';
import PromptEditor from '../../components/Admin/PromptEditor';
import { useAdmin } from '../../context/AdminContext';

const PromptManager: React.FC = () => {
  const { prompts, savePrompt, loading, error } = usePromptManager();
  const isAdmin = useAdmin();

  if (!isAdmin) {
    return <p>No autorizado</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Prompts</h1>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-4">
        {prompts.map((p) => (
          <div key={p.id} className="border p-4 rounded">
            <h3 className="font-semibold mb-2">{p.type}</h3>
            <PromptEditor
              initialType={p.type}
              initialContent={p.content}
              onSave={(type, content) => savePrompt(type, content)}
            />
          </div>
        ))}
      </div>
      <div className="mt-8 border-t pt-4">
        <h2 className="font-semibold mb-2">Nuevo prompt</h2>
        <PromptEditor onSave={(type, content) => savePrompt(type, content)} />
      </div>
    </div>
  );
};

export default PromptManager;
