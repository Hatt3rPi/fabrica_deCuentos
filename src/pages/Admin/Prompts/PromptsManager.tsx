import React, { useState } from 'react';
import { usePrompts } from '../../../hooks/usePrompts';
import PromptForm from '../../../components/Prompts/PromptForm';
import PromptAccordion from '../../../components/Prompts/PromptAccordion';
import Button from '../../../components/UI/Button';
import { useAdmin } from '../../../context/AdminContext';

const PromptsManager: React.FC = () => {
  const isAdmin = useAdmin();
  const { prompts, createPrompt, updatePrompt, loading } = usePrompts();
  const [showForm, setShowForm] = useState(false);

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
      <div className="space-y-2">
        {prompts.map(p => (
          <PromptAccordion key={p.id} prompt={p} onSave={content => updatePrompt(p.id, content)} />
        ))}
      </div>
      <PromptForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={async (type, content) => {
          await createPrompt(type, content);
          setShowForm(false);
        }}
      />
    </div>
  );
};

export default PromptsManager;
