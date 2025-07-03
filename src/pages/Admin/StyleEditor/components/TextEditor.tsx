import React from 'react';
import { Type, RotateCcw } from 'lucide-react';
import { PageType } from '../../../../types/styleConfig';

interface TextEditorProps {
  coverText: string;
  pageText: string;
  dedicatoriaText?: string;
  contraportadaText?: string;
  onCoverTextChange: (text: string) => void;
  onPageTextChange: (text: string) => void;
  onDedicatoriaTextChange?: (text: string) => void;
  onContraportadaTextChange?: (text: string) => void;
  currentPageType: PageType;
}

const DEFAULT_TEXTS = {
  cover: 'El Mágico Viaje de Luna',
  page: 'Luna caminaba por el sendero del bosque encantado, donde las luciérnagas bailaban entre los árboles iluminando su camino. El viento susurraba secretos antiguos mientras las hojas doradas crujían bajo sus pequeños pies.',
  dedicatoria: 'Para mi querida hija Luna, que siempre sueña con aventuras mágicas y llena nuestros días de alegría.',
  contraportada: 'Una historia mágica llena de aventuras, donde Luna descubre que los sueños pueden hacerse realidad cuando tienes el corazón valiente y la imaginación despierta.'
};

const TextEditor: React.FC<TextEditorProps> = ({
  coverText,
  pageText,
  dedicatoriaText,
  contraportadaText,
  onCoverTextChange,
  onPageTextChange,
  onDedicatoriaTextChange,
  onContraportadaTextChange,
  currentPageType
}) => {
  const currentText = 
    currentPageType === 'cover' ? coverText :
    currentPageType === 'dedicatoria' ? (dedicatoriaText || '') :
    currentPageType === 'contraportada' ? (contraportadaText || '') :
    pageText;
  
  const onTextChange = 
    currentPageType === 'cover' ? onCoverTextChange :
    currentPageType === 'dedicatoria' ? (onDedicatoriaTextChange || (() => {})) :
    currentPageType === 'contraportada' ? (onContraportadaTextChange || (() => {})) :
    onPageTextChange;
  
  const defaultText = DEFAULT_TEXTS[currentPageType];

  const handleReset = () => {
    onTextChange(defaultText);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <Type className="w-4 h-4 inline mr-1" />
          Texto de {
            currentPageType === 'cover' ? 'Portada' :
            currentPageType === 'dedicatoria' ? 'Dedicatoria' :
            'Página Interior'
          }
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
          rows={currentPageType === 'dedicatoria' ? 3 : 4}
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