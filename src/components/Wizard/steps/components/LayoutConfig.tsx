import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

type LayoutOption = 'imagen-arriba' | 'imagen-abajo' | 'imagen-izquierda' | 'imagen-derecha';
type AlignmentOption = 'centro' | 'izquierda' | 'derecha';
type ImageSizeOption = 'pequena' | 'mediana' | 'grande';

interface LayoutConfigProps {
  layout: LayoutOption;
  alignment: AlignmentOption;
  imageSize: ImageSizeOption;
  isDisabled: boolean;
  onLayoutChange: <K extends keyof LayoutConfigData>(field: K, value: LayoutConfigData[K]) => void;
  // Nuevas props para restricciones admin
  allowedLayouts?: LayoutOption[];
  allowedAlignments?: AlignmentOption[];
  adminImageSize?: ImageSizeOption;
}

interface LayoutConfigData {
  layout: LayoutOption;
  alignment: AlignmentOption;
  imageSize: ImageSizeOption;
}

const LayoutConfig: React.FC<LayoutConfigProps> = ({
  layout,
  alignment,
  imageSize,
  isDisabled,
  onLayoutChange,
  allowedLayouts = ['imagen-arriba', 'imagen-abajo', 'imagen-izquierda', 'imagen-derecha'],
  allowedAlignments = ['centro', 'izquierda', 'derecha'],
  adminImageSize
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        {isDisabled ? 'Configuración de Layout - Solo Lectura' : 'Configuración de Layout'}
      </h3>

      {/* Posición de imagen */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Posición de la imagen
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'imagen-arriba' as const, label: 'Arriba' },
            { value: 'imagen-abajo' as const, label: 'Abajo' },
            { value: 'imagen-izquierda' as const, label: 'Izquierda' },
            { value: 'imagen-derecha' as const, label: 'Derecha' }
          ].filter(option => allowedLayouts.includes(option.value)).map((option) => (
            <button
              key={option.value}
              onClick={() => onLayoutChange('layout', option.value)}
              disabled={isDisabled}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                isDisabled
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : layout === option.value
                    ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tamaño de imagen */}
      {adminImageSize ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tamaño de imagen
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Tamaño configurado por el administrador: <strong>{adminImageSize === 'pequena' ? 'Pequeña' : adminImageSize === 'mediana' ? 'Mediana' : 'Grande'}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tamaño de imagen
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'pequena' as const, label: 'Pequeña' },
              { value: 'mediana' as const, label: 'Mediana' },
              { value: 'grande' as const, label: 'Grande' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onLayoutChange('imageSize', option.value)}
                disabled={isDisabled}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  isDisabled
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : imageSize === option.value
                      ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alineación de texto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alineación del texto
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'izquierda' as const, label: 'Izquierda', icon: AlignLeft },
            { value: 'centro' as const, label: 'Centro', icon: AlignCenter },
            { value: 'derecha' as const, label: 'Derecha', icon: AlignRight }
          ].filter(option => allowedAlignments.includes(option.value)).map((option) => (
            <button
              key={option.value}
              onClick={() => onLayoutChange('alignment', option.value)}
              disabled={isDisabled}
              className={`p-2 rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                isDisabled
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : alignment === option.value
                    ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
              }`}
            >
              <option.icon className="w-4 h-4" />
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayoutConfig;