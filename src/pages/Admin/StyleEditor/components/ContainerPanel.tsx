import React from 'react';
import { Settings, Square, Circle, Box, AlignLeft, AlignCenter, AlignRight, AlignJustify, ArrowUp, ArrowDown, Maximize2, Move3D } from 'lucide-react';

interface ContainerPanelProps {
  containerStyle: any;
  onChange: (updates: any) => void;
  pageType: 'cover' | 'page';
}

const BORDER_STYLES = [
  { value: 'none', label: 'Sin borde' },
  { value: 'solid', label: 'Sólido' },
  { value: 'dashed', label: 'Discontinuo' },
  { value: 'dotted', label: 'Punteado' },
  { value: 'double', label: 'Doble' }
];

const BORDER_RADIUS_PRESETS = [
  { value: '0', label: 'Sin redondeo', icon: <Square className="w-4 h-4" /> },
  { value: '0.25rem', label: 'Sutil' },
  { value: '0.5rem', label: 'Pequeño' },
  { value: '1rem', label: 'Mediano' },
  { value: '1.5rem', label: 'Grande' },
  { value: '2rem', label: 'Muy grande' },
  { value: '50%', label: 'Circular', icon: <Circle className="w-4 h-4" /> }
];

const HORIZONTAL_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Izquierda', icon: <AlignLeft className="w-4 h-4" /> },
  { value: 'center', label: 'Centro', icon: <AlignCenter className="w-4 h-4" /> },
  { value: 'right', label: 'Derecha', icon: <AlignRight className="w-4 h-4" /> }
];

const VERTICAL_ALIGNMENT_OPTIONS = [
  { value: 'top', label: 'Superior', icon: <ArrowUp className="w-4 h-4" /> },
  { value: 'center', label: 'Centro', icon: <AlignCenter className="w-4 h-4" /> },
  { value: 'bottom', label: 'Inferior', icon: <ArrowDown className="w-4 h-4" /> }
];

const SCALE_UNIT_OPTIONS = [
  { value: 'px', label: 'Píxeles' },
  { value: '%', label: 'Porcentaje' },
  { value: 'auto', label: 'Automático' }
];

// Dimensiones base del sistema (1536x1024)
const BASE_DIMENSIONS = {
  width: 1536,
  height: 1024
};

const ContainerPanel: React.FC<ContainerPanelProps> = ({ containerStyle, onChange, pageType }) => {
  // Parsear valores de borde
  const parseBorder = (border: string) => {
    if (!border || border === 'none') {
      return { width: 0, style: 'none', color: '#e5e7eb' };
    }
    
    const parts = border.split(' ');
    return {
      width: parseInt(parts[0]) || 0,
      style: parts[1] || 'solid',
      color: parts[2] || '#e5e7eb'
    };
  };

  const borderValues = parseBorder(containerStyle.border);

  const updateBorder = (updates: Partial<typeof borderValues>) => {
    const newBorder = { ...borderValues, ...updates };
    if (newBorder.width === 0 || newBorder.style === 'none') {
      onChange({ border: 'none' });
    } else {
      onChange({ border: `${newBorder.width}px ${newBorder.style} ${newBorder.color}` });
    }
  };

  // Parsear border radius
  const getBorderRadiusValue = () => {
    const radius = containerStyle.borderRadius || '0';
    const match = radius.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const getBorderRadiusUnit = () => {
    const radius = containerStyle.borderRadius || '0';
    if (radius.includes('%')) return '%';
    if (radius.includes('rem')) return 'rem';
    return 'px';
  };

  // Parsear márgenes (si existen)
  const parseMargin = (margin: string) => {
    if (!margin) return { top: 0, right: 0, bottom: 0, left: 0 };
    
    const values = margin.split(' ').map(v => parseInt(v) || 0);
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

  const marginValues = parseMargin(containerStyle.margin);

  const updateMargin = (side: string, value: number) => {
    const current = { ...marginValues };
    current[side as keyof typeof current] = value;
    const margin = `${current.top}rem ${current.right}rem ${current.bottom}rem ${current.left}rem`;
    onChange({ margin });
  };

  // Obtener valores de alineación actuales
  const getHorizontalAlignment = () => {
    return containerStyle.horizontalAlignment || 'center';
  };

  const getVerticalAlignment = () => {
    return containerStyle.verticalAlignment || 'center';
  };

  // Obtener valores de escalado actuales
  const getScaleValues = () => {
    return {
      width: containerStyle.scaleWidth || '100',
      height: containerStyle.scaleHeight || '100',
      widthUnit: containerStyle.scaleWidthUnit || '%',
      heightUnit: containerStyle.scaleHeightUnit || '%',
      maintainAspectRatio: containerStyle.maintainAspectRatio || false
    };
  };

  const scaleValues = getScaleValues();

  // Actualizar alineación
  const updateAlignment = (type: 'horizontal' | 'vertical', value: string) => {
    console.log('[container] 📦 UPDATEALIGNMENT LLAMADO:', { type, value });
    if (type === 'horizontal') {
      onChange({ horizontalAlignment: value });
    } else {
      onChange({ verticalAlignment: value });
    }
  };

  // Actualizar escalado
  const updateScale = (updates: Partial<typeof scaleValues>) => {
    console.log('[container] 📦 UPDATESCALE LLAMADO:', updates);
    const newScale = { ...scaleValues, ...updates };
    
    // Si mantener aspecto está habilitado y se cambió width, ajustar height
    if (newScale.maintainAspectRatio && updates.width && !updates.height) {
      newScale.height = updates.width; // Mantener la misma proporción
    }
    // Si mantener aspecto está habilitado y se cambió height, ajustar width
    else if (newScale.maintainAspectRatio && updates.height && !updates.width) {
      newScale.width = updates.height; // Mantener la misma proporción
    }

    const scaleUpdate = {
      scaleWidth: newScale.width,
      scaleHeight: newScale.height,
      scaleWidthUnit: newScale.widthUnit,
      scaleHeightUnit: newScale.heightUnit,
      maintainAspectRatio: newScale.maintainAspectRatio
    };
    
    console.log('[container] 📦 ENVIANDO SCALE UPDATE:', scaleUpdate);
    onChange(scaleUpdate);
  };

  return (
    <div className="space-y-6">
      {/* NUEVA SECCIÓN: Alineación Horizontal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Move3D className="w-4 h-4 inline mr-1" />
          Alineación Horizontal
        </label>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          {HORIZONTAL_ALIGNMENT_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => updateAlignment('horizontal', option.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors ${
                getHorizontalAlignment() === option.value
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title={option.label}
            >
              {option.icon}
              <span className="text-xs">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* NUEVA SECCIÓN: Alineación Vertical */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <AlignJustify className="w-4 h-4 inline mr-1" />
          Alineación Vertical
        </label>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          {VERTICAL_ALIGNMENT_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => updateAlignment('vertical', option.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors ${
                getVerticalAlignment() === option.value
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title={option.label}
            >
              {option.icon}
              <span className="text-xs">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* NUEVA SECCIÓN: Escalado de Contenido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Maximize2 className="w-4 h-4 inline mr-1" />
          Escalado de Contenido
        </label>
        
        {/* Mantener proporción */}
        <div className="mb-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={scaleValues.maintainAspectRatio}
              onChange={(e) => updateScale({ maintainAspectRatio: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Mantener proporción
            </span>
          </label>
        </div>

        {/* Ancho */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Ancho
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={scaleValues.widthUnit === '%' ? 500 : BASE_DIMENSIONS.width}
              value={scaleValues.width}
              onChange={(e) => {
                console.log('[container] 📌 Cambio WIDTH:', e.target.value);
                updateScale({ width: e.target.value });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={scaleValues.widthUnit}
              onChange={(e) => updateScale({ widthUnit: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {SCALE_UNIT_OPTIONS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alto */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Alto
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={scaleValues.heightUnit === '%' ? 500 : BASE_DIMENSIONS.height}
              value={scaleValues.height}
              onChange={(e) => updateScale({ height: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={scaleValues.maintainAspectRatio}
            />
            <select
              value={scaleValues.heightUnit}
              onChange={(e) => updateScale({ heightUnit: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={scaleValues.maintainAspectRatio}
            >
              {SCALE_UNIT_OPTIONS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Información de dimensiones base */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Dimensiones base:</strong> {BASE_DIMENSIONS.width}x{BASE_DIMENSIONS.height} píxeles
          </p>
        </div>
      </div>
      {/* Border Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Box className="w-4 h-4 inline mr-1" />
          Redondeo de Esquinas
        </label>
        
        {/* Presets */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {BORDER_RADIUS_PRESETS.slice(0, 6).map(preset => (
            <button
              key={preset.value}
              onClick={() => onChange({ borderRadius: preset.value })}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                containerStyle.borderRadius === preset.value
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {preset.icon || preset.label}
            </button>
          ))}
        </div>

        {/* Valor personalizado */}
        <div className="flex gap-2">
          <input
            type="range"
            min="0"
            max={getBorderRadiusUnit() === '%' ? 50 : 40}
            step={getBorderRadiusUnit() === 'rem' ? 0.25 : 1}
            value={getBorderRadiusValue()}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              const unit = getBorderRadiusUnit();
              onChange({ borderRadius: `${value}${unit}` });
            }}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max={getBorderRadiusUnit() === '%' ? 50 : 40}
              step={getBorderRadiusUnit() === 'rem' ? 0.25 : 1}
              value={getBorderRadiusValue()}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                const unit = getBorderRadiusUnit();
                onChange({ borderRadius: `${value}${unit}` });
              }}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            />
            <select
              value={getBorderRadiusUnit()}
              onChange={(e) => {
                const value = getBorderRadiusValue();
                onChange({ borderRadius: `${value}${e.target.value}` });
              }}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            >
              <option value="px">px</option>
              <option value="rem">rem</option>
              <option value="%">%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Borde */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Square className="w-4 h-4 inline mr-1" />
          Borde
        </label>

        {/* Estilo de borde */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Estilo
          </label>
          <select
            value={borderValues.style}
            onChange={(e) => updateBorder({ style: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {BORDER_STYLES.map(style => (
              <option key={style.value} value={style.value}>{style.label}</option>
            ))}
          </select>
        </div>

        {/* Ancho de borde */}
        {borderValues.style !== 'none' && (
          <>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Ancho
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={borderValues.width}
                  onChange={(e) => updateBorder({ width: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                  {borderValues.width}px
                </span>
              </div>
            </div>

            {/* Color de borde */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={borderValues.color}
                  onChange={(e) => updateBorder({ color: e.target.value })}
                  className="w-10 h-8 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={borderValues.color}
                  onChange={(e) => updateBorder({ color: e.target.value })}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                  placeholder="#e5e7eb"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Márgenes externos (solo si es necesario) */}
      {pageType === 'cover' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Settings className="w-4 h-4 inline mr-1" />
            Márgenes Externos (rem)
          </label>
          <div className="space-y-2">
            {/* Top */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Superior</span>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={marginValues.top}
                onChange={(e) => updateMargin('top', parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={marginValues.top}
                onChange={(e) => updateMargin('top', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
              />
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Derecha</span>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={marginValues.right}
                onChange={(e) => updateMargin('right', parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={marginValues.right}
                onChange={(e) => updateMargin('right', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
              />
            </div>

            {/* Bottom */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Inferior</span>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={marginValues.bottom}
                onChange={(e) => updateMargin('bottom', parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={marginValues.bottom}
                onChange={(e) => updateMargin('bottom', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
              />
            </div>

            {/* Left */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Izquierda</span>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={marginValues.left}
                onChange={(e) => updateMargin('left', parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={marginValues.left}
                onChange={(e) => updateMargin('left', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Configuraciones especiales para páginas */}
      {pageType === 'page' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Configuraciones Especiales
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={containerStyle.borderTop !== undefined}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange({ borderTop: '1px solid #d4af37' });
                  } else {
                    const updates = { ...containerStyle };
                    delete updates.borderTop;
                    onChange(updates);
                  }
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Solo borde superior
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Información */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Usa la alineación para posicionar el contenido dentro del contenedor, 
          y el escalado para ajustar el tamaño manteniendo la calidad. 
          Las dimensiones base son {BASE_DIMENSIONS.width}x{BASE_DIMENSIONS.height} píxeles.
        </p>
      </div>
    </div>
  );
};

export default ContainerPanel;