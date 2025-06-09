import React from 'react';

export type ModelType = 'text' | 'image' | 'audio' | 'legacy';

interface ModelBadgeProps {
  type: ModelType;
  className?: string;
}

const ModelBadge: React.FC<ModelBadgeProps> = ({ type, className = '' }) => {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  
  const typeClasses = {
    text: 'bg-blue-100 text-blue-800',
    image: 'bg-green-100 text-green-800',
    audio: 'bg-purple-100 text-purple-800',
    legacy: 'bg-gray-100 text-gray-800'
  };

  const typeLabels = {
    text: 'Texto',
    image: 'Imagen',
    audio: 'Audio',
    legacy: 'Legacy'
  };

  return (
    <span className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {typeLabels[type]}
    </span>
  );
};

export default ModelBadge;
