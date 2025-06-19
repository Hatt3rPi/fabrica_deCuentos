import React from 'react';
import { Move, ArrowUp, ArrowDown, Maximize2 } from 'lucide-react';

interface PositionPanelProps {
  config: any;
  onChange: (updates: any) => void;
  pageType: 'cover' | 'page';
}

const PositionPanel: React.FC<PositionPanelProps> = ({ config, onChange, pageType }) => {
  const verticalPositions = [
    { value: 'top', label: 'Superior', icon: '↑' },
    { value: 'center', label: 'Centro', icon: '•' },
    { value: 'bottom', label: 'Inferior', icon: '↓' }
  ];

  const horizontalPositions = [
    { value: 'left', label: 'Izquierda', icon: '←' },
    { value: 'center', label: 'Centro', icon: '•' },
    { value: 'right', label: 'Derecha', icon: '→' }
  ];

  // Extraer valores de padding
  const parsePadding = (padding: string) => {
    const values = padding.split(' ').map(v => parseInt(v) || 0);
    if (values.length === 1) {
      return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
    } else if (values.length === 2) {
      return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
    } else if (values.length === 3) {
      return { top: values[0], right: values[1], bottom: values[2], left: values[1] };
    } else {
      return { top: values[0] || 0, right: values[1] || 0, bottom: values[2] || 0, left: values[3] || 0 };
    }
  };

  const paddingValues = parsePadding(config.containerStyle.padding);

  const updatePadding = (side: string, value: number) => {
    const current = { ...paddingValues };
    current[side as keyof typeof current] = value;
    const padding = `${current.top}rem ${current.right}rem ${current.bottom}rem ${current.left}rem`;
    onChange({
      containerStyle: {
        ...config.containerStyle,
        padding
      }
    });
  };

  const getMaxWidthValue = () => {
    const maxWidth = config.containerStyle.maxWidth || '100%';
    const match = maxWidth.match(/(\d+)/);
    return match ? parseInt(match[1]) : 100;
  };

  const getMaxWidthUnit = () => {
    const maxWidth = config.containerStyle.maxWidth || '100%';
    return maxWidth.includes('px') ? 'px' : '%';
  };

  const updateMaxWidth = (value: number, unit: string) => {
    onChange({
      containerStyle: {
        ...config.containerStyle,
        maxWidth: `${value}${unit}`
      }
    });
  };

  const getMinHeightValue = () => {
    const minHeight = config.containerStyle.minHeight || '0%';
    const match = minHeight.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Vertical Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Move className="w-4 h-4 inline mr-1" />
          Posición Vertical
        </label>
        <div className="grid grid-cols-3 gap-2">
          {verticalPositions.map(pos => (
            <button
              key={pos.value}
              onClick={() => onChange({ position: pos.value })}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                config.position === pos.value
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{pos.icon}</div>
              <div className="text-xs">{pos.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Move className="w-4 h-4 inline mr-1" />
          Posición Horizontal
        </label>
        <div className="grid grid-cols-3 gap-2">
          {horizontalPositions.map(pos => (
            <button
              key={pos.value}
              onClick={() => onChange({ textAlign: pos.value })}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                config.textAlign === pos.value
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{pos.icon}</div>
              <div className="text-xs">{pos.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Padding */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Espaciado Interior (rem)
        </label>
        <div className="space-y-2">
          {/* Top */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Superior</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={paddingValues.top}
              onChange={(e) => updatePadding('top', parseFloat(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={paddingValues.top}
              onChange={(e) => updatePadding('top', parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            />
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Derecha</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={paddingValues.right}
              onChange={(e) => updatePadding('right', parseFloat(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={paddingValues.right}
              onChange={(e) => updatePadding('right', parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            />
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Inferior</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={paddingValues.bottom}
              onChange={(e) => updatePadding('bottom', parseFloat(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={paddingValues.bottom}
              onChange={(e) => updatePadding('bottom', parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            />
          </div>

          {/* Left */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Izquierda</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={paddingValues.left}
              onChange={(e) => updatePadding('left', parseFloat(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={paddingValues.left}
              onChange={(e) => updatePadding('left', parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Max Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Maximize2 className="w-4 h-4 inline mr-1" />
          Ancho Máximo
        </label>
        <div className="flex gap-2">
          <input
            type="range"
            min={getMaxWidthUnit() === '%' ? 10 : 100}
            max={getMaxWidthUnit() === '%' ? 100 : 1200}
            step={getMaxWidthUnit() === '%' ? 5 : 50}
            value={getMaxWidthValue()}
            onChange={(e) => updateMaxWidth(parseInt(e.target.value), getMaxWidthUnit())}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={getMaxWidthUnit() === '%' ? 10 : 100}
              max={getMaxWidthUnit() === '%' ? 100 : 1200}
              value={getMaxWidthValue()}
              onChange={(e) => updateMaxWidth(parseInt(e.target.value) || 100, getMaxWidthUnit())}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            />
            <select
              value={getMaxWidthUnit()}
              onChange={(e) => updateMaxWidth(getMaxWidthValue(), e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            >
              <option value="%">%</option>
              <option value="px">px</option>
            </select>
          </div>
        </div>
      </div>

      {/* Min Height (solo para páginas) */}
      {pageType === 'page' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <ArrowDown className="w-4 h-4 inline mr-1" />
            Altura Mínima (%)
          </label>
          <div className="flex gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={getMinHeightValue()}
              onChange={(e) => onChange({
                containerStyle: {
                  ...config.containerStyle,
                  minHeight: `${e.target.value}%`
                }
              })}
              className="flex-1"
            />
            <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
              {getMinHeightValue()}%
            </span>
          </div>
        </div>
      )}

      {/* Vertical Align (solo para páginas) */}
      {pageType === 'page' && config.position === 'bottom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Alineación Vertical del Contenedor
          </label>
          <select
            value={config.verticalAlign || 'flex-end'}
            onChange={(e) => onChange({ verticalAlign: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="flex-start">Arriba del contenedor</option>
            <option value="center">Centro del contenedor</option>
            <option value="flex-end">Abajo del contenedor</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default PositionPanel;