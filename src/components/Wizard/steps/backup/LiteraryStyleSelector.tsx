import React from 'react';
import { styleOptions } from '../../../../types';

interface LiteraryStyleSelectorProps {
  selectedStyle: string;
  onChange: (value: string) => void;
}

const LiteraryStyleSelector: React.FC<LiteraryStyleSelectorProps> = ({
  selectedStyle,
  onChange
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Estilo literario
      </label>
      <div className="grid grid-cols-2 gap-4">
        {styleOptions.map((option) => (
          <div
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`group cursor-pointer p-4 rounded-lg border-2 transition-all relative overflow-hidden ${
              selectedStyle === option.value
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-200'
            }`}
          >
            <h3 className="font-medium text-gray-900 mb-2">{option.label}</h3>
            <div className="relative">
              <p className="text-sm text-gray-600 line-clamp-2 group-hover:line-clamp-none">
                {option.example}
              </p>
              {/* Overlay that appears on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none" />
            </div>
            {/* Expanded text that shows on hover */}
            <div className="absolute inset-0 bg-white p-4 opacity-0 group-hover:opacity-100 transition-opacity overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-2">{option.label}</h3>
              <p className="text-sm text-gray-600">{option.example}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiteraryStyleSelector;
