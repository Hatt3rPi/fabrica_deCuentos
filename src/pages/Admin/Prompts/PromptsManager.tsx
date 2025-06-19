import React, { useState } from 'react';
import { usePrompts } from '../../../hooks/usePrompts';
import PromptForm from '../../../components/Prompts/PromptForm';
import PromptAccordion from '../../../components/Prompts/PromptAccordion';
import Button from '../../../components/UI/Button';
import { useAdmin } from '../../../context/AdminContext';
import { edgeFunctionList, promptEdgeMap } from '../../../constants/promptEdgeMap';
import { edgeFunctionColorMap } from '../../../constants/edgeFunctionColors';

const PromptsManager: React.FC = () => {
  const isAdmin = useAdmin();
  const { prompts, createPrompt, updatePrompt, loading } = usePrompts();
  const [showForm, setShowForm] = useState(false);
  const [filterEdge, setFilterEdge] = useState<string | null>(null);

  const filteredPrompts = filterEdge
    ? prompts.filter(p => (promptEdgeMap[p.type] || []).includes(filterEdge))
    : prompts;

  if (!isAdmin) {
    return <p>No autorizado</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Prompts</h1>
        <Button onClick={() => setShowForm(true)}>Nuevo Prompt</Button>
      </div>
      {loading && <p>Cargando...</p>}
      <div className="flex flex-wrap gap-2">
        {edgeFunctionList.map(edge => (
          <span
            key={edge}
            onClick={() => setFilterEdge(edge)}
            className={`cursor-pointer inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              filterEdge === edge
                ? edgeFunctionColorMap[edge]?.active || 'bg-indigo-600 text-white'
                : edgeFunctionColorMap[edge]?.base || 'bg-indigo-100 text-indigo-800'
            }`}
          >
            {edge}
          </span>
        ))}
        {filterEdge && (
          <button
            onClick={() => setFilterEdge(null)}
            className="text-xs underline text-gray-500"
          >
            Mostrar todos
          </button>
        )}
      </div>
      <div className="space-y-2">
        {filteredPrompts.map(p => (
          <PromptAccordion
            key={p.id}
            prompt={p}
            onSave={(content, endpoint, model, size, quality, width, height) => 
              updatePrompt(p.id, content, endpoint, model, size, quality, width, height)
            }
          />
        ))}
      </div>
      <PromptForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={async (type, content, endpoint, model) => {
          await createPrompt(type, content, endpoint, model);
          setShowForm(false);
        }}
      />
    </div>
  );
};

export default PromptsManager;
