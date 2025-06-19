import React, { useState } from 'react';
import { Layers, Palette, Square, Circle } from 'lucide-react';

interface EffectsPanelProps {
  containerStyle: any;
  onChange: (updates: any) => void;
}

const BACKGROUND_PRESETS = [
  { name: 'Transparente', value: 'transparent' },
  { name: 'Blanco 90%', value: 'rgba(255,255,255,0.9)' },
  { name: 'Blanco 70%', value: 'rgba(255,255,255,0.7)' },
  { name: 'Negro 90%', value: 'rgba(0,0,0,0.9)' },
  { name: 'Negro 70%', value: 'rgba(0,0,0,0.7)' },
  { name: 'Negro 50%', value: 'rgba(0,0,0,0.5)' },
];

const GRADIENT_PRESETS = [
  { 
    name: 'Oscuro inferior', 
    value: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)' 
  },
  { 
    name: 'Oscuro superior', 
    value: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)' 
  },
  { 
    name: 'Claro inferior', 
    value: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.7), transparent)' 
  },
  { 
    name: 'Oscuro completo', 
    value: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7))' 
  },
  { 
    name: 'Viñeta', 
    value: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)' 
  },
  { 
    name: 'Sin gradiente', 
    value: '' 
  }
];

const EffectsPanel: React.FC<EffectsPanelProps> = ({ containerStyle, onChange }) => {
  const [backgroundType, setBackgroundType] = useState<'solid' | 'gradient'>('solid');

  // Parsear valores actuales
  const getCurrentBackgroundColor = () => {
    if (containerStyle.background === 'transparent' || 
        containerStyle.background?.includes('gradient')) {
      return 'rgba(255,255,255,0.9)';
    }
    return containerStyle.background || 'rgba(255,255,255,0.9)';
  };

  const getCurrentGradient = () => {
    return containerStyle.gradientOverlay || '';
  };

  // Extraer valores de box-shadow
  const parseBoxShadow = (shadow: string) => {
    if (!shadow || shadow === 'none') {
      return { x: 0, y: 0, blur: 0, spread: 0, color: 'rgba(0,0,0,0.1)' };
    }
    
    const regex = /(-?\d+(?:\.\d+)?px)\s+(-?\d+(?:\.\d+)?px)\s+(-?\d+(?:\.\d+)?px)\s+(-?\d+(?:\.\d+)?px)?\s*(rgba?\([^)]+\)|#[0-9a-fA-F]+)?/;
    const match = shadow.match(regex);
    
    if (match) {
      return {
        x: parseInt(match[1]),
        y: parseInt(match[2]),
        blur: parseInt(match[3]),
        spread: match[4] ? parseInt(match[4]) : 0,
        color: match[5] || 'rgba(0,0,0,0.1)'
      };
    }
    
    return { x: 0, y: 4, blur: 6, spread: 0, color: 'rgba(0,0,0,0.1)' };
  };

  const shadowValues = parseBoxShadow(containerStyle.boxShadow);

  const updateBoxShadow = (updates: Partial<typeof shadowValues>) => {
    const newShadow = { ...shadowValues, ...updates };
    if (newShadow.x === 0 && newShadow.y === 0 && newShadow.blur === 0) {
      onChange({ boxShadow: 'none' });
    } else {
      const boxShadow = `${newShadow.x}px ${newShadow.y}px ${newShadow.blur}px ${newShadow.spread}px ${newShadow.color}`;
      onChange({ boxShadow });
    }
  };

  // Blur de fondo
  const getBackdropBlur = () => {
    const blur = containerStyle.backdropFilter;
    if (!blur || !blur.includes('blur')) return 0;
    const match = blur.match(/blur\((\d+)px\)/);
    return match ? parseInt(match[1]) : 0;
  };

  const updateBackdropBlur = (value: number) => {
    if (value === 0) {
      onChange({ backdropFilter: 'none' });
    } else {
      onChange({ backdropFilter: `blur(${value}px)` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tipo de Fondo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Layers className="w-4 h-4 inline mr-1" />
          Tipo de Fondo
        </label>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setBackgroundType('solid')}
            className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
              backgroundType === 'solid'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Square className="w-4 h-4 inline mr-1" />
            Sólido
          </button>
          <button
            onClick={() => setBackgroundType('gradient')}
            className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
              backgroundType === 'gradient'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Palette className="w-4 h-4 inline mr-1" />
            Degradado
          </button>
        </div>
      </div>

      {/* Fondo del Contenedor */}
      {backgroundType === 'solid' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color de Fondo
          </label>
          <div className="space-y-2">
            {BACKGROUND_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => onChange({ background: preset.value })}
                className={`w-full px-3 py-2 text-left rounded-lg border transition-colors flex items-center justify-between ${
                  containerStyle.background === preset.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-sm">{preset.name}</span>
                <div 
                  className="w-6 h-6 rounded border border-gray-400"
                  style={{ 
                    background: preset.value === 'transparent' 
                      ? 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 12px 12px'
                      : preset.value 
                  }}
                />
              </button>
            ))}
            
            {/* Color personalizado */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={getCurrentBackgroundColor()}
                onChange={(e) => onChange({ background: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                placeholder="rgba(255,255,255,0.9)"
              />
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Gradiente */}
      {backgroundType === 'gradient' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Overlay de Gradiente
          </label>
          <div className="space-y-2">
            {GRADIENT_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => onChange({ gradientOverlay: preset.value })}
                className={`w-full px-3 py-2 text-left rounded-lg border transition-colors ${
                  containerStyle.gradientOverlay === preset.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-sm">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blur de Fondo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Desenfoque de Fondo
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={getBackdropBlur()}
            onChange={(e) => updateBackdropBlur(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
            {getBackdropBlur()}px
          </span>
        </div>
      </div>

      {/* Sombra del Contenedor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Sombra del Contenedor
        </label>
        
        <div className="space-y-3">
          {/* Desplazamiento X */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Desplazamiento X
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={shadowValues.x}
                onChange={(e) => updateBoxShadow({ x: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                {shadowValues.x}px
              </span>
            </div>
          </div>

          {/* Desplazamiento Y */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Desplazamiento Y
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={shadowValues.y}
                onChange={(e) => updateBoxShadow({ y: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                {shadowValues.y}px
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
                max="40"
                step="2"
                value={shadowValues.blur}
                onChange={(e) => updateBoxShadow({ blur: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                {shadowValues.blur}px
              </span>
            </div>
          </div>

          {/* Expansión */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Expansión
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={shadowValues.spread}
                onChange={(e) => updateBoxShadow({ spread: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                {shadowValues.spread}px
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Presets de Sombra de Contenedor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Presets de Sombra
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ boxShadow: 'none' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Sin sombra
          </button>
          <button
            onClick={() => onChange({ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Sutil
          </button>
          <button
            onClick={() => onChange({ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Suave
          </button>
          <button
            onClick={() => onChange({ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Mediana
          </button>
          <button
            onClick={() => onChange({ boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Grande
          </button>
          <button
            onClick={() => onChange({ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Dramática
          </button>
        </div>
      </div>
    </div>
  );
};

export default EffectsPanel;