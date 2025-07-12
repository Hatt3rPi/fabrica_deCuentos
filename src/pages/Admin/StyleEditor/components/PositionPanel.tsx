import React from 'react';
import { Move, ArrowUp, ArrowDown, Maximize2, Crop } from 'lucide-react';

interface PositionPanelProps {
  config: any;
  onChange: (updates: any) => void;
  pageType: 'cover' | 'page';
  isImageComponent?: boolean;
  containerDimensions?: { width: number; height: number };
}

const PositionPanel: React.FC<PositionPanelProps> = ({ config, onChange, pageType, isImageComponent = false, containerDimensions }) => {
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

  const paddingValues = parsePadding(config.containerStyle?.padding || '2rem');

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
    const maxWidth = config.containerStyle?.maxWidth || '100%';
    const match = maxWidth.match(/(\d+)/);
    return match ? parseInt(match[1]) : 100;
  };

  const getMaxWidthUnit = () => {
    const maxWidth = config.containerStyle?.maxWidth || '100%';
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
    const minHeight = config.containerStyle?.minHeight || '0%';
    const match = minHeight.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Funciones para dimensiones de imagen
  const getImageWidth = () => {
    if (!isImageComponent) return 300;
    const width = config.width || '300px';
    const match = width.match(/(\d+)/);
    return match ? parseInt(match[1]) : 300;
  };

  const getImageHeight = () => {
    if (!isImageComponent) return 200;
    const height = config.height || '200px';
    const match = height.match(/(\d+)/);
    return match ? parseInt(match[1]) : 200;
  };

  const updateImageDimension = (dimension: 'width' | 'height', value: number) => {
    onChange({
      [dimension]: `${value}px`
    });
  };

  // Función para convertir posición vertical a coordenadas
  const handleVerticalPositionChange = (verticalPos: string) => {
    console.log('🐛[DEBUG] Position change:', {
      componentName: config.name,
      newPosition: verticalPos,
      containerDimensions,
      isImageComponent
    });

    if (!containerDimensions) {
      console.log('[PositionPanel] No hay containerDimensions, enviando solo position');
      onChange({ position: verticalPos });
      return;
    }

    const containerHeight = containerDimensions.height;
    // Para texto, usar una estimación más realista basada en el contenedor
    const componentHeight = isImageComponent ? getImageHeight() : Math.min(150, containerHeight * 0.2); // 20% del contenedor o 150px
    let y = 0;

    // Márgenes adaptativos: más margen para texto
    const verticalMargin = isImageComponent ? 20 : 40;

    switch (verticalPos) {
      case 'top':
        // Borde superior del componente en el límite superior
        y = verticalMargin;
        break;
      case 'center':
        // Centro del componente en el centro del contenedor
        y = Math.round((containerHeight - componentHeight) / 2);
        break;
      case 'bottom':
        // Borde inferior del componente en el límite inferior
        y = Math.round(containerHeight - componentHeight - verticalMargin);
        break;
    }

    const updates = { 
      position: verticalPos,
      y: Math.max(0, y) // Asegurar que no sea negativo
    };

    console.log('🐛[DEBUG] Position updates:', {
      componentName: config.name,
      updates,
      calculations: {
        containerHeight,
        componentHeight,
        verticalMargin,
        calculatedY: y
      }
    });

    // Actualizar tanto la posición conceptual como las coordenadas precisas
    onChange(updates);
  };

  // Función para convertir posición horizontal a coordenadas
  const handleHorizontalPositionChange = (horizontalPos: string) => {
    if (!containerDimensions) {
      onChange({ horizontalPosition: horizontalPos });
      return;
    }

    const containerWidth = containerDimensions.width;
    // Para texto, verificar si tiene maxWidth configurado
    let componentWidth = 200; // valor por defecto
    
    if (isImageComponent) {
      componentWidth = getImageWidth();
    } else {
      // Para texto, usar maxWidth si está definido, sino usar 95% para Autor, 85% para otros
      const defaultMaxWidth = config.name?.includes('Autor') ? '95%' : '85%';
      const maxWidth = config.containerStyle?.maxWidth || defaultMaxWidth;
      if (maxWidth.includes('%')) {
        const percent = parseInt(maxWidth) / 100;
        componentWidth = Math.round(containerWidth * percent);
      } else if (maxWidth.includes('px')) {
        componentWidth = parseInt(maxWidth);
      } else {
        componentWidth = Math.round(containerWidth * 0.85);
      }
    }
    
    let x = 0;

    // Márgenes adaptativos: más margen para texto
    const horizontalMargin = isImageComponent ? 20 : 40;

    switch (horizontalPos) {
      case 'left':
        // Borde izquierdo del componente en el límite izquierdo
        x = horizontalMargin;
        break;
      case 'center':
        // Centro del componente en el centro del contenedor
        x = Math.round((containerWidth - componentWidth) / 2);
        break;
      case 'right':
        // Borde derecho del componente en el límite derecho
        x = Math.round(containerWidth - componentWidth - horizontalMargin);
        break;
    }

    const updates = { 
      horizontalPosition: horizontalPos,
      x: Math.max(0, x) // Asegurar que no sea negativo
    };

    // Actualizar tanto la posición conceptual como las coordenadas precisas
    onChange(updates);
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
              onClick={() => handleVerticalPositionChange(pos.value)}
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
              onClick={() => handleHorizontalPositionChange(pos.value)}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                (config.horizontalPosition || 'center') === pos.value
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

      {/* Image Dimensions - Solo para componentes de imagen */}
      {isImageComponent && (
        <>
          {/* Image Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Crop className="w-4 h-4 inline mr-1" />
              Ancho de Imagen (px)
            </label>
            <div className="flex gap-2">
              <input
                type="range"
                min="50"
                max="800"
                step="10"
                value={getImageWidth()}
                onChange={(e) => updateImageDimension('width', parseInt(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="50"
                max="800"
                value={getImageWidth()}
                onChange={(e) => updateImageDimension('width', parseInt(e.target.value) || 300)}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 self-center">px</span>
            </div>
          </div>

          {/* Image Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Crop className="w-4 h-4 inline mr-1" />
              Alto de Imagen (px)
            </label>
            <div className="flex gap-2">
              <input
                type="range"
                min="50"
                max="600"
                step="10"
                value={getImageHeight()}
                onChange={(e) => updateImageDimension('height', parseInt(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="50"
                max="600"
                value={getImageHeight()}
                onChange={(e) => updateImageDimension('height', parseInt(e.target.value) || 200)}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 self-center">px</span>
            </div>
          </div>
        </>
      )}

      {/* Max Width - Solo para páginas o componentes no imagen */}
      {!isImageComponent && (
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
      )}

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