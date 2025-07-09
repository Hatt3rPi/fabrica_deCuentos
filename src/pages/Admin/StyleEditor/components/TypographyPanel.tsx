import React from 'react';
import { Type, Bold, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface TypographyPanelProps {
  config: any;
  onChange: (updates: any) => void;
}

// Fuentes populares de Google Fonts
const FONT_OPTIONS = [
  // Manuscritas/Handwriting
  { value: 'Indie Flower', label: 'Indie Flower', category: 'handwriting' },
  { value: 'Caveat', label: 'Caveat', category: 'handwriting' },
  { value: 'Comic Neue', label: 'Comic Neue', category: 'handwriting' },
  { value: 'Kalam', label: 'Kalam', category: 'handwriting' },
  
  // Divertidas/Display
  { value: 'Caprasimo', label: 'Caprasimo', category: 'display' },
  { value: 'Barriecito', label: 'Barriecito', category: 'display' },
  { value: 'Barrio', label: 'Barrio', category: 'display' },
  { value: 'Galindo', label: 'Galindo', category: 'display' },
  { value: 'Lakki Reddy', label: 'Lakki Reddy', category: 'display' },
  { value: 'Rampart One', label: 'Rampart One', category: 'display' },
  { value: 'Ribeye', label: 'Ribeye', category: 'display' },
  { value: 'Slackey', label: 'Slackey', category: 'display' },
  { value: 'Spicy Rice', label: 'Spicy Rice', category: 'display' },
  { value: 'Fredoka', label: 'Fredoka', category: 'display' },
  { value: 'Chewy', label: 'Chewy', category: 'display' },
  { value: 'Pacifico', label: 'Pacifico', category: 'display' },
  
  // Sans-serif
  { value: 'Inter', label: 'Inter', category: 'sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', category: 'sans-serif' },
  
  // Serif
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { value: 'Georgia', label: 'Georgia', category: 'serif' },
  { value: 'Crimson Text', label: 'Crimson Text', category: 'serif' }
];

const FONT_WEIGHTS = [
  { value: '100', label: 'Thin' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' }
];

const TypographyPanel: React.FC<TypographyPanelProps> = ({ config, onChange }) => {
  // Extraer el valor de la fuente actual del config
  const getCurrentFontValue = () => {
    if (!config.fontFamily) return 'Indie Flower';
    
    // Extraer el nombre de la fuente del fontFamily string
    // Puede venir como: "Roboto", sans-serif o Roboto, sans-serif
    const fontMatch = config.fontFamily.match(/^["']?([^"',]+)["']?/);
    const currentFont = fontMatch ? fontMatch[1].trim() : 'Indie Flower';
    
    // Verificar si la fuente existe en nuestras opciones
    const fontExists = FONT_OPTIONS.some(f => f.value === currentFont);
    return fontExists ? currentFont : 'Indie Flower';
  };

  // Extraer valor numérico del fontSize
  const getFontSizeValue = () => {
    const match = config.fontSize.match(/(\d+(?:\.\d+)?)/);
    const value = match ? parseFloat(match[1]) : 1;
    // Limitar el valor al rango 0.1-10
    return Math.min(Math.max(value, 0.1), 10);
  };

  const getFontSizeUnit = () => {
    const match = config.fontSize.match(/(px|rem|em)$/);
    return match ? match[1] : 'rem';
  };

  const handleFontSizeChange = (value: number) => {
    const unit = getFontSizeUnit();
    // Limitar el valor al rango permitido
    const clampedValue = Math.min(Math.max(value, 0.1), 10);
    onChange({ fontSize: `${clampedValue}${unit}` });
  };

  const handleFontSizeUnitChange = (unit: string) => {
    const value = getFontSizeValue();
    onChange({ fontSize: `${value}${unit}` });
  };

  const getLineHeightValue = () => {
    return parseFloat(config.lineHeight || '1.5');
  };

  const getLetterSpacingValue = () => {
    const match = (config.letterSpacing || '0').match(/([-\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Type className="w-4 h-4 inline mr-1" />
          Fuente
        </label>
        <select
          value={getCurrentFontValue()}
          onChange={(e) => {
            const font = FONT_OPTIONS.find(f => f.value === e.target.value);
            const fontFamily = font?.category === 'serif' 
              ? `"${e.target.value}", serif`
              : font?.category === 'sans-serif'
              ? `"${e.target.value}", sans-serif`
              : `"${e.target.value}", cursive`;
            onChange({ fontFamily });
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <optgroup label="Manuscritas">
            {FONT_OPTIONS.filter(f => f.category === 'handwriting').map(font => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Divertidas">
            {FONT_OPTIONS.filter(f => f.category === 'display').map(font => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Sans Serif">
            {FONT_OPTIONS.filter(f => f.category === 'sans-serif').map(font => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Serif">
            {FONT_OPTIONS.filter(f => f.category === 'serif').map(font => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tamaño de Fuente
        </label>
        <div className="flex gap-2">
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={getFontSizeValue()}
            onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={getFontSizeValue()}
              onChange={(e) => handleFontSizeChange(parseFloat(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            />
            <select
              value={getFontSizeUnit()}
              onChange={(e) => handleFontSizeUnitChange(e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            >
              <option value="px">px</option>
              <option value="rem">rem</option>
              <option value="em">em</option>
            </select>
          </div>
        </div>
      </div>

      {/* Font Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Bold className="w-4 h-4 inline mr-1" />
          Peso de Fuente
        </label>
        <select
          value={config.fontWeight}
          onChange={(e) => onChange({ fontWeight: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {FONT_WEIGHTS.map(weight => (
            <option key={weight.value} value={weight.value}>{weight.label}</option>
          ))}
        </select>
      </div>

      {/* Line Height */}
      {'lineHeight' in config && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Altura de Línea
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={getLineHeightValue()}
              onChange={(e) => onChange({ lineHeight: e.target.value })}
              className="flex-1"
            />
            <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
              {getLineHeightValue()}
            </span>
          </div>
        </div>
      )}

      {/* Text Align */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alineación de Texto
        </label>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => onChange({ textAlign: 'left' })}
            className={`flex-1 px-3 py-2 rounded transition-colors ${
              config.textAlign === 'left'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <AlignLeft className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => onChange({ textAlign: 'center' })}
            className={`flex-1 px-3 py-2 rounded transition-colors ${
              config.textAlign === 'center'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <AlignCenter className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => onChange({ textAlign: 'right' })}
            className={`flex-1 px-3 py-2 rounded transition-colors ${
              config.textAlign === 'right'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <AlignRight className="w-4 h-4 mx-auto" />
          </button>
          {'textAlign' in config && config.textAlign === 'justify' && (
            <button
              onClick={() => onChange({ textAlign: 'justify' })}
              className={`flex-1 px-3 py-2 rounded transition-colors ${
                config.textAlign === 'justify'
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <AlignJustify className="w-4 h-4 mx-auto" />
            </button>
          )}
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Espaciado de Letras
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="-5"
            max="10"
            step="0.5"
            value={getLetterSpacingValue()}
            onChange={(e) => onChange({ letterSpacing: `${e.target.value}px` })}
            className="flex-1"
          />
          <span className="w-16 text-sm text-gray-600 dark:text-gray-400 text-right">
            {getLetterSpacingValue()}px
          </span>
        </div>
      </div>

      {/* Text Transform (solo para títulos) */}
      {config.position && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transformación de Texto
          </label>
          <select
            value={config.textTransform || 'none'}
            onChange={(e) => onChange({ textTransform: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="none">Normal</option>
            <option value="uppercase">MAYÚSCULAS</option>
            <option value="lowercase">minúsculas</option>
            <option value="capitalize">Capitalizar</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default TypographyPanel;