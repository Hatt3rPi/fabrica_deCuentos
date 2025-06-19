import React from 'react';
import { Type, RotateCcw } from 'lucide-react';

interface TextEditorProps {
  coverText: string;
  pageText: string;
  onCoverTextChange: (text: string) => void;
  onPageTextChange: (text: string) => void;
  currentPageType: 'cover' | 'page';
}

const DEFAULT_TEXTS = {
  cover: 'El Mágico Viaje de Luna',
  page: 'Luna caminaba por el sendero del bosque encantado, donde las luciérnagas bailaban entre los árboles iluminando su camino. El viento susurraba secretos antiguos mientras las hojas doradas crujían bajo sus pequeños pies.'
};

const TextEditor: React.FC<TextEditorProps> = ({
  coverText,
  pageText,
  onCoverTextChange,
  onPageTextChange,
  currentPageType
}) => {
  const currentText = currentPageType === 'cover' ? coverText : pageText;
  const onTextChange = currentPageType === 'cover' ? onCoverTextChange : onPageTextChange;
  const defaultText = DEFAULT_TEXTS[currentPageType];

  const handleReset = () => {
    onTextChange(defaultText);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <Type className="w-4 h-4 inline mr-1" />
          Texto de {currentPageType === 'cover' ? 'Portada' : 'Página Interior'}
        </label>
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Restaurar
        </button>
      </div>

      {currentPageType === 'cover' ? (
        <input
          type="text"
          value={currentText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={defaultText}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      ) : (
        <textarea
          value={currentText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={defaultText}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Este texto se usa solo para previsualizar los estilos. No afecta las historias existentes.
      </p>
    </div>
  );
};

export default TextEditor;