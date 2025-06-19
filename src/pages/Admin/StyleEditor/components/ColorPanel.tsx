import React, { useState } from 'react';
import { Palette, Droplet, Sun } from 'lucide-react';

interface ColorPanelProps {
  config: any;
  onChange: (updates: any) => void;
}

const COLOR_PRESETS = [
  { name: 'Blanco', value: '#ffffff' },
  { name: 'Negro', value: '#000000' },
  { name: 'Gris Oscuro', value: '#2c3e50' },
  { name: 'Gris Claro', value: '#95a5a6' },
  { name: 'Rojo', value: '#e74c3c' },
  { name: 'Rosa', value: '#ff6b6b' },
  { name: 'Naranja', value: '#f39c12' },
  { name: 'Amarillo', value: '#f1c40f' },
  { name: 'Verde', value: '#27ae60' },
  { name: 'Turquesa', value: '#1abc9c' },
  { name: 'Azul', value: '#3498db' },
  { name: 'Púrpura', value: '#9b59b6' },
  { name: 'Dorado', value: '#d4af37' },
  { name: 'Plateado', value: '#bdc3c7' }
];

const ColorPanel: React.FC<ColorPanelProps> = ({ config, onChange }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Parsear text-shadow
  const parseTextShadow = (shadow: string) => {
    const regex = /(-?\d+(?:\.\d+)?px)\s+(-?\d+(?:\.\d+)?px)\s+(-?\d+(?:\.\d+)?px)\s+(rgba?\([^)]+\)|#[0-9a-fA-F]+)/;
    const match = shadow.match(regex);
    
    if (match) {
      return {
        offsetX: parseInt(match[1]),
        offsetY: parseInt(match[2]),
        blur: parseInt(match[3]),
        color: match[4]
      };
    }
    
    return {
      offsetX: 3,
      offsetY: 3,
      blur: 6,
      color: 'rgba(0,0,0,0.8)'
    };
  };

  const shadowValues = parseTextShadow(config.textShadow);

  const updateTextShadow = (updates: Partial<typeof shadowValues>) => {
    const newShadow = { ...shadowValues, ...updates };
    const textShadow = `${newShadow.offsetX}px ${newShadow.offsetY}px ${newShadow.blur}px ${newShadow.color}`;
    onChange({ textShadow });
  };

  // Extraer opacidad del color si es rgba
  const getColorOpacity = (color: string) => {
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d*\.?\d+)?\)/);
    if (rgbaMatch && rgbaMatch[4]) {
      return parseFloat(rgbaMatch[4]) * 100;
    }
    return 100;
  };

  // Convertir hex a rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  // Obtener color base sin opacidad
  const getBaseColor = (color: string) => {
    if (color.startsWith('#')) return color;
    
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    return '#ffffff';
  };

  const textColorBase = getBaseColor(config.color);
  const textOpacity = getColorOpacity(config.color);

  return (
    <div className="space-y-6">
      {/* Color del Texto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Palette className="w-4 h-4 inline mr-1" />
          Color del Texto
        </label>
        
        {/* Color Picker */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="color"
              value={textColorBase}
              onChange={(e) => {
                const newColor = textOpacity < 100 
                  ? hexToRgba(e.target.value, textOpacity)
                  : e.target.value;
                onChange({ color: newColor });
              }}
              className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
            />
          </div>
          <input
            type="text"
            value={config.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            placeholder="#ffffff"
          />
        </div>

        {/* Presets de Color */}
        <div className="grid grid-cols-7 gap-1">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => onChange({ color: preset.value })}
              className="group relative"
              title={preset.name}
            >
              <div
                className="w-full h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: preset.value }}
              />
              {config.color === preset.value && (
                <div className="absolute inset-0 rounded border-2 border-purple-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Opacidad del Texto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Droplet className="w-4 h-4 inline mr-1" />
          Opacidad del Texto
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={textOpacity}
            onChange={(e) => {
              const opacity = parseInt(e.target.value);
              const newColor = hexToRgba(textColorBase, opacity);
              onChange({ color: newColor });
            }}
            className="flex-1"
          />
          <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
            {textOpacity}%
          </span>
        </div>
      </div>

      {/* Sombra del Texto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Sun className="w-4 h-4 inline mr-1" />
          Sombra del Texto
        </label>

        {/* Desplazamiento X */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Desplazamiento Horizontal
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={shadowValues.offsetX}
                onChange={(e) => updateTextShadow({ offsetX: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                {shadowValues.offsetX}px
              </span>
            </div>
          </div>

          {/* Desplazamiento Y */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Desplazamiento Vertical
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={shadowValues.offsetY}
                onChange={(e) => updateTextShadow({ offsetY: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                {shadowValues.offsetY}px
              </span>
            </div>
          </div>

          {/* Desenfoque */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Desenfoque
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={shadowValues.blur}
                onChange={(e) => updateTextShadow({ blur: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                {shadowValues.blur}px
              </span>
            </div>
          </div>

          {/* Color de Sombra */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Color de Sombra
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={getBaseColor(shadowValues.color)}
                onChange={(e) => {
                  const opacity = getColorOpacity(shadowValues.color) / 100;
                  updateTextShadow({ color: hexToRgba(e.target.value, opacity * 100) });
                }}
                className="w-10 h-8 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                value={shadowValues.color}
                onChange={(e) => updateTextShadow({ color: e.target.value })}
                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                placeholder="rgba(0,0,0,0.8)"
              />
            </div>
          </div>

          {/* Opacidad de Sombra */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Opacidad de Sombra
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={getColorOpacity(shadowValues.color)}
                onChange={(e) => {
                  const opacity = parseInt(e.target.value);
                  const baseColor = getBaseColor(shadowValues.color);
                  updateTextShadow({ color: hexToRgba(baseColor, opacity) });
                }}
                className="flex-1"
              />
              <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                {getColorOpacity(shadowValues.color)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Presets de Sombra */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Presets de Sombra
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ textShadow: 'none' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Sin sombra
          </button>
          <button
            onClick={() => onChange({ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Sutil
          </button>
          <button
            onClick={() => onChange({ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Moderada
          </button>
          <button
            onClick={() => onChange({ textShadow: '3px 3px 6px rgba(0,0,0,0.8)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Fuerte
          </button>
          <button
            onClick={() => onChange({ textShadow: '4px 4px 8px rgba(0,0,0,0.9)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Muy fuerte
          </button>
          <button
            onClick={() => onChange({ textShadow: '0 0 10px rgba(255,255,255,0.8)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Resplandor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPanel;