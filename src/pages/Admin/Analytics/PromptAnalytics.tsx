import React from 'react';
import { useAdmin } from '../../../context/AdminContext';

const PromptAnalytics: React.FC = () => {
  const isAdmin = useAdmin();

  if (!isAdmin) {
    return <p>No autorizado</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Análisis de Prompts</h1>
      <p className="text-sm text-gray-600">Próximamente se mostrarán las métricas de rendimiento.</p>
    </div>
  );
};

export default PromptAnalytics;
